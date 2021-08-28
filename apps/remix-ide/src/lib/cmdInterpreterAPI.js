'use strict'
import { CompilerImports } from '@remix-project/core-plugin'
var yo = require('yo-yo')
var async = require('async')
var EventManager = require('../lib/events')

var toolTip = require('../app/ui/tooltip')
var globalRegistry = require('../global/registry')
var SourceHighlighter = require('../app/editor/sourceHighlighter')
var GistHandler = require('./gist-handler')

class CmdInterpreterAPI {
  constructor (terminal, localRegistry, blockchain) {
    const self = this
    self.event = new EventManager()
    self.blockchain = blockchain
    self._components = {}
    self._components.registry = localRegistry || globalRegistry
    self._components.terminal = terminal
    self._components.sourceHighlighter = new SourceHighlighter()
    self._components.fileImport = new CompilerImports()
    self._components.gistHandler = new GistHandler()
    self._deps = {
      fileManager: self._components.registry.get('filemanager').api,
      editor: self._components.registry.get('editor').api,
      compilersArtefacts: self._components.registry.get('compilersartefacts').api,
      offsetToLineColumnConverter: self._components.registry.get('offsettolinecolumnconverter').api
    }
    self.commandHelp = {
      'remix.loadgist(id)': 'Load a gist in the file explorer.',
      'remix.loadurl(url)': 'Load the given url in the file explorer. The url can be of type github, swarm, ipfs or raw http',
      'remix.execute(filepath)': 'Run the script specified by file path. If filepath is empty, script currently displayed in the editor is executed.',
      'remix.exeCurrent()': 'Run the script currently displayed in the editor',
      'remix.help()': 'Display this help message'
    }
  }

  log () { arguments[0] != null ? this._components.terminal.commands.html(arguments[0]) : this._components.terminal.commands.html(arguments[1]) }
  loadgist (id, cb) {
    const self = this
    self._components.gistHandler.loadFromGist({ gist: id }, this._deps.fileManager)
    if (cb) cb()
  }

  loadurl (url, cb) {
    const self = this
    self._components.fileImport.import(url,
      (loadingMsg) => { toolTip(loadingMsg) },
      (err, content, cleanUrl, type, url) => {
        if (err) {
          toolTip(`Unable to load ${url}: ${err}`)
          if (cb) cb(err)
        } else {
          self._deps.fileManager.writeFile(type + '/' + cleanUrl, content)
          try {
            content = JSON.parse(content)
            async.eachOfSeries(content.sources, (value, file, callbackSource) => {
              var url = value.urls[0] // @TODO retrieve all other contents ?
              self._components.fileImport.import(url,
                (loadingMsg) => { toolTip(loadingMsg) },
                async (error, content, cleanUrl, type, url) => {
                  if (error) {
                    toolTip(`Cannot retrieve the content of ${url}: ${error}`)
                    return callbackSource(`Cannot retrieve the content of ${url}: ${error}`)
                  } else {
                    try {
                      await self._deps.fileManager.writeFile(type + '/' + cleanUrl, content)
                      callbackSource()
                    } catch (e) {
                      callbackSource(e.message)
                    }
                  }
                })
            }, (error) => {
              if (cb) cb(error)
            })
          } catch (e) {}
          if (cb) cb()
        }
      })
  }

  exeCurrent (cb) {
    return this.execute(undefined, cb)
  }

  execute (file, cb) {
    const self = this

    function _execute (content, cb) {
      if (!content) {
        toolTip('no content to execute')
        if (cb) cb()
        return
      }
      console.log({ content }, ' contents')
      self._components.terminal.commands.script(content)
    }

    if (typeof file === 'undefined') {
      var content = self._deps.editor.currentContent()
      _execute(content, cb)
      return
    }

    var provider = self._deps.fileManager.fileProviderOf(file)

    if (!provider) {
      toolTip(`provider for path ${file} not found`)
      if (cb) cb()
      return
    }

    provider.get(file, (error, content) => {
      if (error) {
        toolTip(error)
        if (cb) cb()
        return
      }

      _execute(content, cb)
    })
  }

  help (cb) {
    const self = this
    var help = yo`<div></div>`
    for (var k in self.commandHelp) {
      help.appendChild(yo`<div>${k}: ${self.commandHelp[k]}</div>`)
      help.appendChild(yo`<br>`)
    }
    self._components.terminal.commands.html(help)
    if (cb) cb()
    return ''
  }
}

module.exports = CmdInterpreterAPI
