'use strict'
import { Plugin } from '@remixproject/engine'
import { sourceMappingDecoder } from '@remix-project/remix-debug'
import { CompilerAbstract } from '@remix-project/remix-solidity'
import { CompilationResult } from '@remix-project/remix-solidity'
import CodeParserGasService from './services/code-parser-gas-service'
import CodeParserCompiler from './services/code-parser-compiler'
import CodeParserAntlrService from './services/code-parser-antlr-service'
import CodeParserImports, { CodeParserImportsData } from './services/code-parser-imports'
import React from 'react'
import { Profile } from '@remixproject/plugin-utils'
import { ContractDefinitionAstNode, EventDefinitionAstNode, FunctionCallAstNode, FunctionDefinitionAstNode, IdentifierAstNode, ImportDirectiveAstNode, ModifierDefinitionAstNode, SourceUnitAstNode, StructDefinitionAstNode, VariableDeclarationAstNode } from '@remix-project/remix-analyzer'
import { lastCompilationResult, RemixApi } from '@remixproject/plugin-api'
import { antlr } from './types'
import { ParseResult } from './types/antlr-types'

const profile: Profile = {
    name: 'codeParser',
    methods: ['nodesAtPosition', 'getContractNodes', 'getCurrentFileNodes', 'getLineColumnOfNode', 'getLineColumnOfPosition', 'getFunctionParamaters', 'getDeclaration', 'getFunctionReturnParameters', 'getVariableDeclaration', 'getNodeDocumentation', 'getNodeLink', 'listAstNodes', 'getANTLRBlockAtPosition', 'getLastNodeInLine', 'resolveImports', 'parseSolidity', 'getNodesWithScope', 'getNodesWithName', 'getNodes', 'compile', 'getNodeById', 'getLastCompilationResult', 'positionOfDefinition', 'definitionAtPosition', 'jumpToDefinition', 'referrencesAtPosition', 'referencesOf', 'getActiveHighlights', 'gasEstimation', 'declarationOf', 'getGasEstimates', 'getImports'],
    events: [],
    version: '0.0.1'
}

export function isNodeDefinition(node: genericASTNode) {
    return node.nodeType === 'ContractDefinition' ||
        node.nodeType === 'FunctionDefinition' ||
        node.nodeType === 'ModifierDefinition' ||
        node.nodeType === 'VariableDeclaration' ||
        node.nodeType === 'StructDefinition' ||
        node.nodeType === 'EventDefinition'
}

export type genericASTNode =
    ContractDefinitionAstNode
    | FunctionDefinitionAstNode
    | ModifierDefinitionAstNode
    | VariableDeclarationAstNode
    | StructDefinitionAstNode
    | EventDefinitionAstNode
    | IdentifierAstNode
    | FunctionCallAstNode
    | ImportDirectiveAstNode
    | SourceUnitAstNode

interface flatReferenceIndexNode {
    [id: number]: genericASTNode
}

interface declarationIndexNode {
    [id: number]: genericASTNode[]
}

interface codeParserIndex {
    declarations: declarationIndexNode,
    flatReferences: flatReferenceIndexNode,
    nodesPerFile: any
}

export class CodeParser extends Plugin {

    compilerAbstract: CompilerAbstract
    currentFile: string
    nodeIndex: codeParserIndex
    astWalker: any
    errorState: boolean = false

    gastEstimateTimeOut: any

    gasService: CodeParserGasService
    compilerService: CodeParserCompiler
    antlrService: CodeParserAntlrService
    importService: CodeParserImports

    parseSolidity: (text: string) => Promise<antlr.ParseResult>
    getLastNodeInLine: (ast: string) => Promise<any>
    listAstNodes: () => Promise<any>
    getANTLRBlockAtPosition: (position: any, text?: string) => Promise<any>
    setCurrentFileAST: (text?: string) => Promise<ParseResult>
    getImports: () => Promise<CodeParserImportsData[]>

    debuggerIsOn: boolean = false


    constructor(astWalker: any) {
        super(profile)
        this.astWalker = astWalker
        this.nodeIndex = {
            declarations: [[]],
            flatReferences: [],
            nodesPerFile: {}
        }
    }

    async handleChangeEvents() {
        const completionSettings = await this.call('config', 'getAppParameter', 'auto-completion')
        if (completionSettings) {
            this.antlrService.enableWorker()
        } else {
            this.antlrService.disableWorker()
        }
        const showGasSettings = await this.call('config', 'getAppParameter', 'show-gas')
        const showErrorSettings = await this.call('config', 'getAppParameter', 'display-errors')
        if (showGasSettings || showErrorSettings || completionSettings || this.debuggerIsOn) {
            await this.compilerService.compile()
        }
    }

    async onActivation() {

        this.gasService = new CodeParserGasService(this)
        this.compilerService = new CodeParserCompiler(this)
        this.antlrService = new CodeParserAntlrService(this)
        this.importService = new CodeParserImports(this)

        this.parseSolidity = this.antlrService.parseSolidity.bind(this.antlrService)
        this.getLastNodeInLine = this.antlrService.getLastNodeInLine.bind(this.antlrService)
        this.listAstNodes = this.antlrService.listAstNodes.bind(this.antlrService)
        this.getANTLRBlockAtPosition = this.antlrService.getANTLRBlockAtPosition.bind(this.antlrService)
        this.setCurrentFileAST = this.antlrService.setCurrentFileAST.bind(this.antlrService)
        this.getImports = this.importService.getImports.bind(this.importService)

        this.on('editor', 'didChangeFile', async (file) => {
            await this.call('editor', 'discardLineTexts')
            await this.handleChangeEvents()
        })

        this.on('filePanel', 'setWorkspace', async () => {
            await this.call('fileDecorator', 'clearFileDecorators')
            await this.importService.setFileTree()
        })

        this.on('fileManager', 'fileAdded', async () => {
            await this.importService.setFileTree()
        })
        this.on('fileManager', 'fileRemoved', async () => {
            await this.importService.setFileTree()
        })

        this.on('fileManager', 'currentFileChanged', async () => {
            await this.call('editor', 'discardLineTexts')
            const completionSettings = await this.call('config', 'getAppParameter', 'auto-completion')
            if (completionSettings) {
                this.antlrService.setCurrentFileAST()
            }
            await this.handleChangeEvents()
        })

        this.on('solidity', 'loadingCompiler', async (url) => {
            this.compilerService.compiler.loadVersion(true, `${url}?t=${Date.now()}`)
        })

        this.on('config', 'configChanged', async (config) => {
            await this.reload()
        })

        this.on('settings', 'configChanged', async (config) => {
            await this.reload()
        })

        await this.compilerService.init()
        this.on('solidity', 'compilerLoaded', async () => { 
            await this.reload()
        })

        this.on('debugger', 'startDebugging', async () => { 
            this.debuggerIsOn = true
            await this.reload()
        })

        this.on('debugger', 'stopDebugging', async () => { 
            this.debuggerIsOn = false
            await this.reload()
        })
    }

    async reload(){
        await this.call('editor', 'discardLineTexts')
        await this.call('fileDecorator', 'clearFileDecorators')
        await this.call('editor', 'clearErrorMarkers', [this.currentFile])
        await this.handleChangeEvents() 
    }

    /**
     * 
     * @returns 
     */
    async getLastCompilationResult() {
        return this.compilerAbstract
    }

    getSubNodes<T extends genericASTNode>(node: T): number[] {
        return node.nodeType == "ContractDefinition" && node.contractDependencies;
    }

    /**
     * Builds a flat index and declarations of all the nodes in the compilation result
     * @param compilationResult 
     * @param source 
     */
    _buildIndex(compilationResult: CompilationResult, source) {
        if (compilationResult && compilationResult.sources) {
            const callback = (node: genericASTNode) => {
                if (node && ("referencedDeclaration" in node) && node.referencedDeclaration) {
                    if (!this.nodeIndex.declarations[node.referencedDeclaration]) {
                        this.nodeIndex.declarations[node.referencedDeclaration] = []
                    }
                    this.nodeIndex.declarations[node.referencedDeclaration].push(node)
                }
                this.nodeIndex.flatReferences[node.id] = node
            }
            for (const s in compilationResult.sources) {
                this.astWalker.walkFull(compilationResult.sources[s].ast, callback)
            }

        }

    }

    // NODE HELPERS

    _getInputParams(node: FunctionDefinitionAstNode) {
        const params = []
        const target = node.parameters
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


    _flatNodeList(contractNode: ContractDefinitionAstNode, fileName: string, inScope: boolean, compilatioResult: any) {
        const index = {}
        const contractName: string = contractNode.name
        const callback = (node) => {
            if (inScope && node.scope !== contractNode.id
                && !(node.nodeType === 'EnumDefinition' || node.nodeType === 'EventDefinition' || node.nodeType === 'ModifierDefinition'))
                return
            if (inScope) node.isClassNode = true;
            node.gasEstimate = this._getContractGasEstimate(node, contractName, fileName, compilatioResult)
            node.functionName = node.name + this._getInputParams(node)
            node.contractName = contractName
            node.contractId = contractNode.id
            index[node.id] = node
        }
        this.astWalker.walkFull(contractNode, callback)
        return index
    }

    _extractFileNodes(fileName: string, compilationResult: lastCompilationResult) {
        if (compilationResult && compilationResult.data.sources && compilationResult.data.sources[fileName]) {
            const source = compilationResult.data.sources[fileName]
            const nodesByContract: any = {}
            nodesByContract.imports = {}
            nodesByContract.contracts = {}
            this.astWalker.walkFull(source.ast, async (node) => {
                //console.log(node)
                if (node.nodeType === 'ContractDefinition') {
                    const flatNodes = this._flatNodeList(node, fileName, false, compilationResult)
                    node.gasEstimate = this._getContractGasEstimate(node, node.name, fileName, compilationResult)
                    nodesByContract.contracts[node.name] = { contractDefinition: node, contractNodes: flatNodes }
                    const baseNodes = {}
                    const baseNodesWithBaseContractScope = {}
                    if (node.linearizedBaseContracts) {
                        for (const id of node.linearizedBaseContracts) {
                            if (id !== node.id) {
                                const baseContract = await this.getNodeById(id)
                                const callback = (node) => {
                                    node.contractName = (baseContract as any).name
                                    node.contractId = (baseContract as any).id
                                    node.isBaseNode = true;
                                    baseNodes[node.id] = node
                                    if ((node.scope && node.scope === baseContract.id)
                                        || node.nodeType === 'EnumDefinition'
                                        || node.nodeType === 'EventDefinition'
                                    ) {
                                        baseNodesWithBaseContractScope[node.id] = node
                                    }
                                    if (node.members) {
                                        for (const member of node.members) {
                                            member.contractName = (baseContract as any).name
                                            member.contractId = (baseContract as any).id
                                            member.isBaseNode = true;
                                        }
                                    }
                                }
                                this.astWalker.walkFull(baseContract, callback)
                            }
                        }
                    }
                    nodesByContract.contracts[node.name].baseNodes = baseNodes
                    nodesByContract.contracts[node.name].baseNodesWithBaseContractScope = baseNodesWithBaseContractScope
                    nodesByContract.contracts[node.name].contractScopeNodes = this._flatNodeList(node, fileName, true, compilationResult)
                    if(node.contractKind == 'interface'){
                        console.log(nodesByContract.contracts[node.name])
                    }
                }
                if (node.nodeType === 'ImportDirective') {

                    const imported = await this.resolveImports(node, {})

                    for (const importedNode of (Object.values(imported) as any)) {
                        if (importedNode.nodes)
                            for (const subNode of importedNode.nodes) {
                                nodesByContract.imports[subNode.id] = subNode
                            }
                    }
                }
            })
            return nodesByContract
        }
    }

    _getContractGasEstimate(node: ContractDefinitionAstNode | FunctionDefinitionAstNode, contractName: string, fileName: string, compilationResult: lastCompilationResult) {

        const contracts = compilationResult.data.contracts && compilationResult.data.contracts[this.currentFile]
        for (const name in contracts) {
            if (name === contractName) {
                const contract = contracts[name]
                const estimationObj = contract.evm && contract.evm.gasEstimates

                let executionCost = null
                if (node.nodeType === 'FunctionDefinition') {
                    const visibility = node.visibility
                    if (node.kind !== 'constructor') {
                        const fnName = node.name
                        const fn = fnName + this._getInputParams(node)

                        if (visibility === 'public' || visibility === 'external') {
                            executionCost = estimationObj === null ? '-' : estimationObj.external[fn]
                        } else if (visibility === 'private' || visibility === 'internal') {
                            executionCost = estimationObj === null ? '-' : estimationObj.internal[fn]
                        }
                        return { executionCost }
                    } else {
                        return {
                            creationCost: estimationObj === null ? '-' : estimationObj.creation.totalCost,
                            codeDepositCost: estimationObj === null ? '-' : estimationObj.creation.codeDepositCost,
                        }
                    }
                }
            }
        }
    }

    /**
     * Nodes at position where position is a number, offset
     * @param position 
     * @param type 
     * @returns 
     */
    async nodesAtPosition(position: number, type = ''): Promise<genericASTNode[]> {
        let lastCompilationResult = this.compilerAbstract
        if(this.debuggerIsOn) {
            lastCompilationResult = await this.call('compilerArtefacts', 'get', '__last')
            this.currentFile = await this.call('fileManager', 'file')
        }
        if (!lastCompilationResult) return []
        const urlFromPath = await this.call('fileManager', 'getUrlFromPath', this.currentFile)
        if (lastCompilationResult && lastCompilationResult.languageversion.indexOf('soljson') === 0 && lastCompilationResult.data && lastCompilationResult.data.sources && lastCompilationResult.data.sources[this.currentFile]) {
            const nodes: genericASTNode[] = sourceMappingDecoder.nodesAtPosition(type, position, lastCompilationResult.data.sources[this.currentFile] || lastCompilationResult.data.sources[urlFromPath.file])
            return nodes
        }
        return []
    }

    /**
     * 
     * @param id 
     * @returns 
     */
    async getNodeById(id: number) {
        for (const key in this.nodeIndex.flatReferences) {
            if (this.nodeIndex.flatReferences[key].id === id) {
                return this.nodeIndex.flatReferences[key]
            }
        }
    }

    /**
     * 
     * @param id 
     * @returns 
     */
    async getDeclaration(id: number) {
        if (this.nodeIndex.declarations && this.nodeIndex.declarations[id]) return this.nodeIndex.declarations[id]
    }

    /**
     * 
     * @param scope 
     * @returns 
     */
    async getNodesWithScope(scope: number) {
        const nodes = []
        for (const node of Object.values(this.nodeIndex.flatReferences)) {
            if (node.scope === scope) nodes.push(node)
        }
        return nodes
    }

    /**
     * 
     * @param name 
     * @returns 
     */
    async getNodesWithName(name: string) {
        const nodes: genericASTNode[] = []
        for (const node of Object.values(this.nodeIndex.flatReferences)) {
            if (node.name === name) nodes.push(node)
        }
        return nodes
    }
    /**
     * 
     * @param node 
     * @returns 
     */
    declarationOf<T extends genericASTNode>(node: T) {
        if (node && ('referencedDeclaration' in node) && node.referencedDeclaration) {
            return this.nodeIndex.flatReferences[node.referencedDeclaration]
        }
        return null
    }

    /**
     * 
     * @param position 
     * @returns 
     */
    async definitionAtPosition(position: number) {
        const nodes = await this.nodesAtPosition(position)
        let nodeDefinition: any
        let node: genericASTNode
        if (nodes && nodes.length && !this.errorState) {
            node = nodes[nodes.length - 1]
            nodeDefinition = node
            if (!isNodeDefinition(node)) {
                nodeDefinition = await this.declarationOf(node) || node
            }
            if (node.nodeType === 'ImportDirective') {
                for (const key in this.nodeIndex.flatReferences) {
                    if (this.nodeIndex.flatReferences[key].id === node.sourceUnit) {
                        nodeDefinition = this.nodeIndex.flatReferences[key]
                    }
                }
            }
            return nodeDefinition
        } else {
            const astNodes = await this.antlrService.listAstNodes()
            if (astNodes && astNodes.length) {
                for (const node of astNodes) {
                    if (node.range[0] <= position && node.range[1] >= position) {
                        if (nodeDefinition && nodeDefinition.range[0] < node.range[0]) {
                            nodeDefinition = node
                        }
                        if (!nodeDefinition) nodeDefinition = node
                    }
                }
                if (nodeDefinition && nodeDefinition.type && nodeDefinition.type === 'Identifier') {
                    const nodeForIdentifier = await this.findIdentifier(nodeDefinition)
                    if (nodeForIdentifier) nodeDefinition = nodeForIdentifier
                }
                return nodeDefinition
            }
        }

    }

    async getContractNodes(contractName: string) {
        if (this.nodeIndex.nodesPerFile
            && this.nodeIndex.nodesPerFile[this.currentFile]
            && this.nodeIndex.nodesPerFile[this.currentFile].contracts[contractName]
            && this.nodeIndex.nodesPerFile[this.currentFile].contracts[contractName].contractNodes) {
            return this.nodeIndex.nodesPerFile[this.currentFile].contracts[contractName]
        }
        return false
    }

    async getCurrentFileNodes() {
        if (this.nodeIndex.nodesPerFile
            && this.nodeIndex.nodesPerFile[this.currentFile]) {
            return this.nodeIndex.nodesPerFile[this.currentFile]
        }
        return false
    }

    /**
     * 
     * @param identifierNode 
     * @returns 
     */
    async findIdentifier(identifierNode: any) {
        const astNodes = await this.antlrService.listAstNodes()
        for (const node of astNodes) {
            if (node.name === identifierNode.name && node.nodeType !== 'Identifier') {
                return node
            }
        }
    }

    /**
     * 
     * @param node 
     * @returns 
     */
    async positionOfDefinition(node: genericASTNode): Promise<any | null> {
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

    /**
     * 
     * @param node 
     * @param imported 
     * @returns 
     */
    async resolveImports(node: any, imported = {}) {
        if (node.nodeType === 'ImportDirective' && !imported[node.sourceUnit]) {
            const importNode: any = await this.getNodeById(node.sourceUnit)
            imported[importNode.id] = importNode
            if (importNode.nodes) {
                for (const child of importNode.nodes) {
                    imported = await this.resolveImports(child, imported)
                }
            }
        }
        return imported
    }



    /**
     * 
     * @param node 
     * @returns 
     */
    referencesOf(node: genericASTNode) {
        const results: genericASTNode[] = []
        const highlights = (id: number) => {
            if (this.nodeIndex.declarations && this.nodeIndex.declarations[id]) {
                const refs = this.nodeIndex.declarations[id]
                for (const ref in refs) {
                    const node = refs[ref]
                    results.push(node)
                }
            }
        }
        if (node && ("referencedDeclaration" in node) && node.referencedDeclaration) {
            highlights(node.referencedDeclaration)
            const current = this.nodeIndex.flatReferences[node.referencedDeclaration]
            results.push(current)
        } else {
            highlights(node.id)
        }
        return results
    }

    /**
     * 
     * @param position 
     * @returns 
     */
    async referrencesAtPosition(position: any): Promise<genericASTNode[]> {
        const nodes = await this.nodesAtPosition(position)
        if (nodes && nodes.length) {
            const node = nodes[nodes.length - 1]
            if (node) {
                return this.referencesOf(node)
            }
        }
    }

    /**
     * 
     * @returns 
     */
    async getNodes(): Promise<flatReferenceIndexNode> {
        return this.nodeIndex.flatReferences
    }



    /**
     * 
     * @param node 
     * @returns 
     */
    async getNodeLink(node: genericASTNode) {
        const lineColumn = await this.getLineColumnOfNode(node)
        const position = await this.positionOfDefinition(node)
        if (this.compilerAbstract && this.compilerAbstract.source && position) {
            const fileName = this.compilerAbstract.getSourceName(position.file)
            return lineColumn ? `${fileName} ${lineColumn.start.line}:${lineColumn.start.column}` : null
        }
        return ''
    }

    /*
    * @param node   
    */
    async getLineColumnOfNode(node: any) {
        const position = await this.positionOfDefinition(node)
        return this.getLineColumnOfPosition(position)
    }

    /*
    * @param position
    */
    async getLineColumnOfPosition(position: any) {
        if (position) {
            const fileName = this.compilerAbstract.getSourceName(position.file)
            const lineBreaks = sourceMappingDecoder.getLinebreakPositions(this.compilerAbstract.source.sources[fileName].content)
            const lineColumn = sourceMappingDecoder.convertOffsetToLineColumn(position, lineBreaks)
            return lineColumn
        }
    }

    /**
     * 
     * @param node 
     * @returns 
     */
    async getNodeDocumentation(node: genericASTNode) {
        if (("documentation" in node) && node.documentation && (node.documentation as any).text) {
            let text = '';
            (node.documentation as any).text.split('\n').forEach(line => {
                text += `${line.trim()}\n`
            })
            return text
        }
    }

    /**
     * 
     * @param node 
     * @returns 
     */
    async getVariableDeclaration(node: any) {
        const nodeVisibility = node.visibility && node.visibility.length ? node.visibility + ' ' : ''
        const nodeName = node.name && node.name.length ? node.name : ''
        if (node.typeDescriptions && node.typeDescriptions.typeString) {
            return `${node.typeDescriptions.typeString} ${nodeVisibility}${nodeName}`
        } else {
            if (node.typeName && node.typeName.name) {
                return `${node.typeName.name} ${nodeVisibility}${nodeName}`
            }
            else if (node.typeName && node.typeName.namePath) {
                return `${node.typeName.namePath} ${nodeVisibility}${nodeName}`
            }
            else {
                return `${nodeName}${nodeName}`
            }
        }
    }

    /**
     * 
     * @param node 
     * @returns 
     */
    async getFunctionParamaters(node: any) {
        const localParam = (node.parameters && node.parameters.parameters) || (node.parameters)
        if (localParam) {
            const params = []
            for (const param of localParam) {
                params.push(await this.getVariableDeclaration(param))
            }
            return `(${params.join(', ')})`
        }
    }

    /**
     * 
     * @param node 
     * @returns 
     */
    async getFunctionReturnParameters(node: any) {
        const localParam = (node.returnParameters && node.returnParameters.parameters)
        if (localParam) {
            const params = []
            for (const param of localParam) {
                params.push(await this.getVariableDeclaration(param))
            }
            return `(${params.join(', ')})`
        }
    }



}
