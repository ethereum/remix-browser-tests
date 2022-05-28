'use strict'
import { Plugin } from '@remixproject/engine'
import { sourceMappingDecoder } from '@remix-project/remix-debug'
import { CompilerAbstract } from '@remix-project/remix-solidity'
import { Compiler } from '@remix-project/remix-solidity'

const profile = {
  name: 'contextualListener',
  methods: ['getBlockName', 'getAST', 'nodesWithScope', 'getNodes', 'compile', 'getNodeById', 'getLastCompilationResult', 'positionOfDefinition', 'definitionAtPosition', 'jumpToDefinition', 'referrencesAtPosition', 'nodesAtEditorPosition', 'referencesOf', 'getActiveHighlights', 'gasEstimation', 'declarationOf', 'jumpToPosition'],
  events: [],
  version: '0.0.1'
}

export function isDefinition(node: any) {
  return node.nodeType === 'ContractDefinition' ||
    node.nodeType === 'FunctionDefinition' ||
    node.nodeType === 'ModifierDefinition' ||
    node.nodeType === 'VariableDeclaration' ||
    node.nodeType === 'StructDefinition' ||
    node.nodeType === 'EventDefinition'
}

const SolidityParser = (window as any).SolidityParser = (window as any).SolidityParser || []

/*
  trigger contextChanged(nodes)
*/
export class EditorContextListener extends Plugin {
  _index: any
  _activeHighlights: Array<any>
  astWalker: any
  currentPosition: any
  currentFile: string
  nodes: Array<any>
  results: any
  estimationObj: any
  creationCost: any
  codeDepositCost: any
  contract: any
  activated: boolean

  lastCompilationResult: any

  lastAST: any
  compiler: any
  onAstFinished: (success: any, data: any, source: any, input: any, version: any) => Promise<void>

  constructor(astWalker) {
    super(profile)
    this.activated = false
    this._index = {
      Declarations: {},
      FlatReferences: {}
    }
    this._activeHighlights = []

    this.astWalker = astWalker
  }

  async onActivation() {
    this.on('editor', 'contentChanged', async () => {
      await this.getAST()
      this._stopHighlighting()
    })

    this.on('solidity', 'loadingCompiler', async(url) => {
      console.log('loading compiler', url)
      this.compiler.loadVersion(true, url)
    })

    this.compiler = new Compiler((url, cb) => this.call('contentImport', 'resolveAndSave', url, undefined, false).then((result) => cb(null, result)).catch((error) => cb(error.message)))
    
    

    this.onAstFinished = async (success, data, source, input, version) => {

      if (!data.sources) return
      if (data.sources && Object.keys(data.sources).length === 0) return
      this.lastCompilationResult = new CompilerAbstract('soljson', data, source, input)

      this._stopHighlighting()
      this._index = {
        Declarations: {},
        FlatReferences: {}
      }
      this._buildIndex(data, source)
      this.emit('astFinished')
    }

    this.compiler.event.register('astFinished', this.onAstFinished)

    setInterval(async () => {

      await this.compile()
    }, 5000)

    setInterval(async () => {
      const compilationResult = this.lastCompilationResult // await this.call('compilerArtefacts', 'getLastCompilationResult')
      if (compilationResult && compilationResult.languageversion.indexOf('soljson') === 0) {

        let currentFile
        try {
          currentFile = await this.call('fileManager', 'file')
        } catch (error) {
          if (error.message !== 'Error: No such file or directory No file selected') throw error
        }
        this._highlightItems(
          await this.call('editor', 'getCursorPosition'),
          compilationResult,
          currentFile
        )
      }
    }, 1000)
  }

  async getLastCompilationResult() {
    return this.lastCompilationResult
  }

  async compile() {
    try {
      const state = await this.call('solidity', 'getCompilerState')
      this.compiler.set('optimize', state.optimize)
      this.compiler.set('evmVersion', state.evmVersion)
      this.compiler.set('language', state.language)
      this.compiler.set('runs', state.runs)
      this.compiler.set('useFileConfiguration', state.useFileConfiguration)
      this.currentFile = await this.call('fileManager', 'file')
      if (!this.currentFile) return
      const content = await this.call('fileManager', 'readFile', this.currentFile)
      const sources = { [this.currentFile]: { content } }
      this.compiler.compile(sources, this.currentFile)
    } catch (e) {
    }
  }

  async getBlockName(position: any, text: string = null) {
    await this.getAST(text)
    const allowedTypes = ['SourceUnit', 'ContractDefinition', 'FunctionDefinition']

    const walkAst = (node) => {
      console.log(node)
      if (node.loc.start.line <= position.lineNumber && node.loc.end.line >= position.lineNumber) {
        const children = node.children || node.subNodes
        if (children && allowedTypes.indexOf(node.type) !== -1) {
          for (const child of children) {
            const result = walkAst(child)
            if (result) return result
          }
        }
        return node
      }
      return null
    }
    if(!this.lastAST) return
    return walkAst(this.lastAST)
  }

  async getAST(text: string = null) {
    this.currentFile = await this.call('fileManager', 'file')
    if (!this.currentFile) return
    let fileContent = text || await this.call('fileManager', 'readFile', this.currentFile)
    try {
      const ast = (SolidityParser as any).parse(fileContent, { loc: true, range: true, tolerant: true })
      this.lastAST = ast
    } catch (e) {
      console.log(e)
    }
    console.log('LAST AST', this.lastAST)
    return this.lastAST
  }

  getActiveHighlights() {
    return [...this._activeHighlights]
  }

  declarationOf(node) {
    if (node && node.referencedDeclaration) {
      return this._index.FlatReferences[node.referencedDeclaration]
    } else {
      // console.log(this._index.FlatReferences)
    }
    return null
  }

  referencesOf(node: any) {
    const results = []
    const highlights = (id) => {
      if (this._index.Declarations && this._index.Declarations[id]) {
        const refs = this._index.Declarations[id]
        for (const ref in refs) {
          const node = refs[ref]
          results.push(node)
        }
      }
    }
    if (node && node.referencedDeclaration) {
      highlights(node.referencedDeclaration)
      const current = this._index.FlatReferences[node.referencedDeclaration]
      results.push(current)
    } else {
      highlights(node.id)
    }
    return results
  }

  async nodesAtEditorPosition(position: any, type: string = '') {
    const lastCompilationResult = this.lastCompilationResult // await this.call('compilerArtefacts', 'getLastCompilationResult')
    if (!lastCompilationResult) return false
    let urlFromPath = await this.call('fileManager', 'getUrlFromPath', this.currentFile)
    if (lastCompilationResult && lastCompilationResult.languageversion.indexOf('soljson') === 0 && lastCompilationResult.data) {
      const nodes = sourceMappingDecoder.nodesAtPosition(type, position, lastCompilationResult.data.sources[this.currentFile] || lastCompilationResult.data.sources[urlFromPath.file])
      return nodes
    }
    return []
  }

  async referrencesAtPosition(position: any) {
    const nodes = await this.nodesAtEditorPosition(position)
    if (nodes && nodes.length) {
      const node = nodes[nodes.length - 1]
      if (node) {
        return this.referencesOf(node)
      }
    }
  }

  async getNodeById(id: any) {
    for (const key in this._index.FlatReferences) {
      if (this._index.FlatReferences[key].id === id) {
        return this._index.FlatReferences[key]
      }
    }
  }

  async nodesWithScope(scope: any) {
    const nodes = []
    for (const node of Object.values(this._index.FlatReferences) as any[]) {
      if (node.scope === scope) nodes.push(node)
    }
    return nodes
  }

  async definitionAtPosition(position: any) {
    const nodes = await this.nodesAtEditorPosition(position)
    console.log('nodes at position', nodes)
    console.log(this._index.FlatReferences)
    let nodeDefinition: any
    let node: any
    if (nodes && nodes.length) {
      node = nodes[nodes.length - 1]
      nodeDefinition = node
      if (!isDefinition(node)) {
        nodeDefinition = await this.declarationOf(node) || node
      }
      if (node.nodeType === 'ImportDirective') {
        for (const key in this._index.FlatReferences) {
          if (this._index.FlatReferences[key].id === node.sourceUnit) {
            nodeDefinition = this._index.FlatReferences[key]
          }
        }
      }
      return nodeDefinition
    } else {
      return false
    }

  }

  async positionOfDefinition(node: any) {
    if (node) {
      if (node.src) {
        const position = sourceMappingDecoder.decode(node.src)
        if (position) {
          return position
        }
      }
    }
    return null
  }

  async jumpToDefinition(position: any) {
    const node = await this.definitionAtPosition(position)
    const sourcePosition = await this.positionOfDefinition(node)
    if (sourcePosition) {
      await this.jumpToPosition(sourcePosition)
    }
  }

  async getNodes() {
    return this._index.FlatReferences
  }

  /*
  * onClick jump to position of ast node in the editor
  */
  async jumpToPosition(position: any) {
    const jumpToLine = async (fileName: string, lineColumn: any) => {
      if (fileName !== await this.call('fileManager', 'file')) {
        console.log('jump to file', fileName)
        await this.call('contentImport', 'resolveAndSave', fileName, null, true)
        await this.call('fileManager', 'open', fileName)
      }
      if (lineColumn.start && lineColumn.start.line >= 0 && lineColumn.start.column >= 0) {
        this.call('editor', 'gotoLine', lineColumn.start.line, lineColumn.end.column + 1)
      }
    }
    const lastCompilationResult = this.lastCompilationResult // await this.call('compilerArtefacts', 'getLastCompilationResult')
    console.log(lastCompilationResult.getSourceCode().sources)
    console.log(position)
    if (lastCompilationResult && lastCompilationResult.languageversion.indexOf('soljson') === 0 && lastCompilationResult.data) {
      const lineColumn = await this.call('offsetToLineColumnConverter', 'offsetToLineColumn',
        position,
        position.file,
        lastCompilationResult.getSourceCode().sources,
        lastCompilationResult.getAsts())
      const filename = lastCompilationResult.getSourceName(position.file)
      // TODO: refactor with rendererAPI.errorClick
      console.log(filename, lineColumn)
      jumpToLine(filename, lineColumn)
    }
  }

  async _highlightItems(cursorPosition, compilationResult, file) {
    if (this.currentPosition === cursorPosition) return
    this._stopHighlighting()
    this.currentPosition = cursorPosition
    this.currentFile = file
    let urlFromPath = await this.call('fileManager', 'getUrlFromPath', this.currentFile)
    if (compilationResult && compilationResult.data && (compilationResult.data.sources[file] || compilationResult.data.sources[urlFromPath.file])) {
      const nodes = sourceMappingDecoder.nodesAtPosition(null, cursorPosition, compilationResult.data.sources[file] || compilationResult.data.sources[urlFromPath.file])
      this.nodes = nodes
      if (nodes && nodes.length && nodes[nodes.length - 1]) {
        await this._highlightExpressions(nodes[nodes.length - 1], compilationResult)
      }
      this.emit('contextChanged', nodes)
    }
  }

  _buildIndex(compilationResult, source) {
    if (compilationResult && compilationResult.sources) {
      const callback = (node) => {
        if (node && node.referencedDeclaration) {
          if (!this._index.Declarations[node.referencedDeclaration]) {
            this._index.Declarations[node.referencedDeclaration] = []
          }
          this._index.Declarations[node.referencedDeclaration].push(node)
        }
        this._index.FlatReferences[node.id] = node
      }
      for (const s in compilationResult.sources) {
        this.astWalker.walkFull(compilationResult.sources[s].ast, callback)
      }
    }
  }

  async _highlight(node, compilationResult) {
    if (!node) return
    const position = sourceMappingDecoder.decode(node.src)
    const fileTarget = compilationResult.getSourceName(position.file)
    const nodeFound = this._activeHighlights.find((el) => el.fileTarget === fileTarget && el.position.file === position.file && el.position.length === position.length && el.position.start === position.start)
    if (nodeFound) return // if the content is already highlighted, do nothing.

    await this._highlightInternal(position, node, compilationResult)
    if (compilationResult && compilationResult.languageversion.indexOf('soljson') === 0) {
      this._activeHighlights.push({ position, fileTarget, nodeId: node.id })
    }
  }

  async _highlightInternal(position, node, compilationResult) {
    if (node.nodeType === 'Block') return
    if (compilationResult && compilationResult.languageversion.indexOf('soljson') === 0) {
      let lineColumn = await this.call('offsetToLineColumnConverter', 'offsetToLineColumn', position, position.file, compilationResult.getSourceCode().sources, compilationResult.getAsts())
      if (node.nodes && node.nodes.length) {
        // If node has children, highlight the entire line. if not, just highlight the current source position of the node.
        lineColumn = {
          start: {
            line: lineColumn.start.line,
            column: 0
          },
          end: {
            line: lineColumn.start.line + 1,
            column: 0
          }
        }
      }
      const fileName = compilationResult.getSourceName(position.file)
      if (fileName) {
        return await this.call('editor', 'highlight', lineColumn, fileName, '', { focus: false })
      }
    }
    return null
  }

  async _highlightExpressions(node, compilationResult) {
    const highlights = async (id) => {
      if (this._index.Declarations && this._index.Declarations[id]) {
        const refs = this._index.Declarations[id]
        for (const ref in refs) {
          const node = refs[ref]
          await this._highlight(node, compilationResult)
        }
      }
    }
    if (node && node.referencedDeclaration) {
      await highlights(node.referencedDeclaration)
      const current = this._index.FlatReferences[node.referencedDeclaration]
      await this._highlight(current, compilationResult)
    } else {
      await highlights(node.id)
      await this._highlight(node, compilationResult)
    }

    this.results = compilationResult
  }

  _stopHighlighting() {
    this.call('editor', 'discardHighlight')
    this.emit('stopHighlighting')
    this._activeHighlights = []
  }

  gasEstimation(node) {
    this._loadContractInfos(node)
    let executionCost, codeDepositCost
    if (node.nodeType === 'FunctionDefinition') {
      const visibility = node.visibility
      if (node.kind !== 'constructor') {
        const fnName = node.name
        const fn = fnName + this._getInputParams(node)
        if (visibility === 'public' || visibility === 'external') {
          executionCost = this.estimationObj === null ? '-' : this.estimationObj.external[fn]
        } else if (visibility === 'private' || visibility === 'internal') {
          executionCost = this.estimationObj === null ? '-' : this.estimationObj.internal[fn]
        }
      } else {
        executionCost = this.creationCost
        codeDepositCost = this.codeDepositCost
      }
    } else {
      executionCost = '-'
    }
    return { executionCost, codeDepositCost }
  }

  _loadContractInfos(node) {
    const path = (this.nodes.length && this.nodes[0].absolutePath) || this.results.source.target
    for (const i in this.nodes) {
      if (this.nodes[i].id === node.scope) {
        const contract = this.nodes[i]
        this.contract = this.results.data.contracts[path][contract.name]
        if (contract) {
          this.estimationObj = this.contract.evm.gasEstimates
          this.creationCost = this.estimationObj === null ? '-' : this.estimationObj.creation.totalCost
          this.codeDepositCost = this.estimationObj === null ? '-' : this.estimationObj.creation.codeDepositCost
        }
      }
    }
  }



  _getInputParams(node) {
    const params = []
    const target = node.parameters
    // for (const i in node.children) {
    //   if (node.children[i].name === 'ParameterList') {
    //     target = node.children[i]
    //     break
    //   }
    // }
    if (target) {
      const children = target.parameters
      for (const j in children) {
        if (children[j].nodeType === 'VariableDeclaration') {
          params.push(children[j].typeDescriptions.typeString)
        }
      }
    }
    return '(' + params.toString() + ')'
  }
}
