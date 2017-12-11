'use strict'
var remixLib = require('remix-lib')
var SourceMappingDecoder = remixLib.SourceMappingDecoder
var AstWalker = remixLib.AstWalker
var EventManager = remixLib.EventManager

/*
  trigger contextChanged(nodes)
*/
class ContextualListener {
  constructor (api, events) {
    this.event = new EventManager()
    this._api = api
    this._index = {
      Declarations: {},
      FlatReferences: {}
    }
    this._activeHighlights = []

    events.compiler.register('compilationFinished', (success, data, source) => {
      this._stopHighlighting()
      this._index = {
        Declarations: {},
        FlatReferences: {}
      }
      if (success) {
        this._buildIndex(data, source)
      }
    })

    events.editor.register('contentChanged', () => { this._stopHighlighting() })

    this.sourceMappingDecoder = new SourceMappingDecoder()
    this.astWalker = new AstWalker()
    setInterval(() => {
      this._highlightItems(api.getCursorPosition(), api.getCompilationResult(), api.getCurrentFile())
    }, 1000)
  }

  getActiveHighlights () {
    return [...this._activeHighlights]
  }

  declarationOf (node) {
    if (node.attributes && node.attributes.referencedDeclaration) {
      return this._index['FlatReferences'][node.attributes.referencedDeclaration]
    }
    return null
  }

  referencesOf (node) {
    return this._index['Declarations'][node.id]
  }

  _highlightItems (cursorPosition, compilationResult, file) {
    if (this.currentPosition === cursorPosition) return
    if (this.currentFile !== file) {
      this.currentFile = file
      this.currentPosition = cursorPosition
      return
    }
    this._stopHighlighting()
    this.currentPosition = cursorPosition
    this.currentFile = file
    if (compilationResult && compilationResult.data && compilationResult.data.sources[file]) {
      var nodes = this.sourceMappingDecoder.nodesAtPosition(null, cursorPosition, compilationResult.data.sources[file])
      if (nodes && nodes.length && nodes[nodes.length - 1]) {
        this._highlightExpressions(nodes[nodes.length - 1], compilationResult)
      }
      this.event.trigger('contextChanged', [nodes])
    }
  }

  _buildIndex (compilationResult, source) {
    if (compilationResult && compilationResult.sources) {
      var self = this
      var callback = {}
      callback['*'] = function (node) {
        if (node && node.attributes && node.attributes.referencedDeclaration) {
          if (!self._index['Declarations'][node.attributes.referencedDeclaration]) {
            self._index['Declarations'][node.attributes.referencedDeclaration] = []
          }
          self._index['Declarations'][node.attributes.referencedDeclaration].push(node)
        }
        self._index['FlatReferences'][node.id] = node
        return true
      }
      for (var s in compilationResult.sources) {
        this.astWalker.walk(compilationResult.sources[s].legacyAST, callback)
      }
    }
  }

  _getGasEstimation (results) {
    this.contractName = Object.keys(results.data.contracts[results.source.target])[0]
    this.target = results.data.contracts[results.source.target]
    this.contract = this.target[this.contractName]
    this.estimationObj = this.contract.evm.gasEstimates
    if (this.estimationObj.external) this.externalFunctions = Object.keys(this.estimationObj.external)
    if (this.estimationObj.internal) this.internalFunctions = Object.keys(this.estimationObj.internal)
    this.creationCost = this.estimationObj.creation.totalCost
    this.codeDepositCost = this.estimationObj.creation.codeDepositCost
  }

  gasEstimation (node) {
    if (node.name === 'FunctionDefinition') {
      if (!node.attributes.isConstructor) {
        var functionName = node.attributes.name
        if (this.externalFunctions) {
          return {executionCost: this.estimationObj.external[this._getFn(this.externalFunctions, functionName)]}
        }
        if (this.internalFunctions) {
          return {executionCost: this.estimationObj.internal[this._getFn(this.internalFunctions, functionName)]}
        }
      } else {
        return {executionCost: this.creationCost, codeDepositCost: this.codeDepositCost}
      }
    }
  }

  _getFn (functions, name) {
    for (var x in functions) {
      if (!!~functions[x].indexOf(name)) {
        var fn = functions[x]
        break
      }
    }
    return fn
  }

  _highlight (node, compilationResult) {
    if (!node) return
    var position = this.sourceMappingDecoder.decode(node.src)
    var eventId = this._api.highlight(position, node)
    if (eventId) {
      this._activeHighlights.push({ eventId, position, fileTarget: this._api.getSourceName(position.file), nodeId: node.id })
    }
  }

  _highlightExpressions (node, compilationResult) {
    var self = this
    function highlights (id) {
      if (self._index['Declarations'] && self._index['Declarations'][id]) {
        var refs = self._index['Declarations'][id]
        for (var ref in refs) {
          var node = refs[ref]
          self._highlight(node, compilationResult)
        }
      }
    }
    if (node.attributes && node.attributes.referencedDeclaration) {
      highlights(node.attributes.referencedDeclaration)
      var current = this._index['FlatReferences'][node.attributes.referencedDeclaration]
      this._highlight(current, compilationResult)
    } else {
      highlights(node.id)
      this._highlight(node, compilationResult)
    }
    this._getGasEstimation(compilationResult)
  }

  _stopHighlighting () {
    for (var event in this._activeHighlights) {
      this._api.stopHighlighting(this._activeHighlights[event])
    }
    this._activeHighlights = []
  }
}

module.exports = ContextualListener
