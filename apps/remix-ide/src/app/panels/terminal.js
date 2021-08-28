/* global Node, requestAnimationFrame */   // eslint-disable-line
import React from 'react' // eslint-disable-line
import ReactDOM from 'react-dom'
import { RemixUiTerminal } from '@remix-ui/terminal' // eslint-disable-line
import { Plugin } from '@remixproject/engine'
import * as packageJson from '../../../../../package.json'
var vm = require('vm')
var EventManager = require('../../lib/events')

var CommandInterpreterAPI = require('../../lib/cmdInterpreterAPI')
var AutoCompletePopup = require('../ui/auto-complete-popup')

import { CompilerImports } from '@remix-project/core-plugin' // eslint-disable-line
var globalRegistry = require('../../global/registry')
var SourceHighlighter = require('../../app/editor/sourceHighlighter')
var GistHandler = require('../../lib/gist-handler')

var KONSOLES = []

function register (api) { KONSOLES.push(api) }

const profile = {
  displayName: 'Terminal',
  name: 'terminal',
  methods: ['log'],
  events: [],
  description: ' - ',
  version: packageJson.version
}

class Terminal extends Plugin {
  constructor (opts, api, config, registry) {
    super(profile)
    this.fileImport = new CompilerImports()
    this.gistHandler = new GistHandler()
    this.event = new EventManager()
    this.registry = registry
    this.globalRegistry = globalRegistry
    this.element = document.createElement('div')
    this.element.setAttribute('class', 'panel')
    this.element.setAttribute('id', 'terminal-view')
    this.eventsDecoder = this.globalRegistry.get('eventsDecoder').api
    this.txListener = this.globalRegistry.get('txlistener').api
    this.sourceHighlighter = new SourceHighlighter()
    this._deps = {
      fileManager: this.registry.get('filemanager').api,
      editor: this.registry.get('editor').api,
      compilersArtefacts: this.registry.get('compilersartefacts').api,
      offsetToLineColumnConverter: this.registry.get('offsettolinecolumnconverter').api
    }
    this.commandHelp = {
      'remix.loadgist(id)': 'Load a gist in the file explorer.',
      'remix.loadurl(url)': 'Load the given url in the file explorer. The url can be of type github, swarm, ipfs or raw http',
      'remix.execute(filepath)': 'Run the script specified by file path. If filepath is empty, script currently displayed in the editor is executed.',
      'remix.exeCurrent()': 'Run the script currently displayed in the editor',
      'remix.help()': 'Display this help message'
    }
    this.blockchain = opts.blockchain
    this.vm = vm
    this._api = api
    this._opts = opts
    this.config = config
    this.version = packageJson.version
    this.data = {
      lineLength: opts.lineLength || 80, // ????
      session: [],
      activeFilters: { commands: {}, input: '' },
      filterFns: {}
    }
    this._view = { el: null, bar: null, input: null, term: null, journal: null, cli: null }
    this._components = {}
    this._components.cmdInterpreter = new CommandInterpreterAPI(this, null, this.blockchain)
    this._components.autoCompletePopup = new AutoCompletePopup(this._opts)
    this._commands = {}
    this.commands = {}
    this._JOURNAL = []
    this._jobs = []
    this._INDEX = {}
    this._INDEX.all = []
    this._INDEX.allMain = []
    this._INDEX.commands = {}
    this._INDEX.commandsMain = {}
    if (opts.shell) this._shell = opts.shell // ???
    register(this)
    this.event.register('debuggingRequested', async (hash) => {
      // TODO should probably be in the run module
      if (!await this._opts.appManager.isActive('debugger')) await this._opts.appManager.activatePlugin('debugger')
      this.call('menuicons', 'select', 'debugger')
      this.call('debugger', 'debug', hash)
    })
    this.logHtmlResponse = []
  }

  onActivation () {
    this.renderComponent()
  }

  onDeactivation () {
    this.off('scriptRunner', 'log')
    this.off('scriptRunner', 'info')
    this.off('scriptRunner', 'warn')
    this.off('scriptRunner', 'error')
  }

  logHtml (html) {
    // console.log({ html: html.innerText })
    this.logHtmlResponse.push(html.innerText)
    this.renderComponent()
    this.logHtmlResponse = []
  }

  render () {
    return this.element
  }

  renderComponent () {
    ReactDOM.render(
      <RemixUiTerminal
        event = {this.event}
        autoCompletePopupEvent = {this._components.autoCompletePopup.event}
        blockchain = {this.blockchain}
        api = {this._api}
        options = {this._opts}
        data = {this.data}
        cmdInterpreter = {this._components.cmdInterpreter}
        autoCompletePopup = {this._components.autoCompletePopup}
        registerCommand = {this.registerCommand}
        command = {this.commands}
        version = {this.version}
        config = {this.config}
        thisState = {this}
        vm = {this.vm}
        blockchain = {this.blockchain}
        commandHelp = {this.commandHelp}
        event = {this.event}
        _deps = {this._deps}
        fileImport = {this.fileImport}
        sourceHighlighter = {this.sourceHighlighter}
        gistHandler ={this.gistHandler}
        registry = {this.registry}
        commands = {this.commands}
        txListener = {this.txListener}
        eventsDecoder = {this.eventsDecoder}
        logHtml = {this.logHtmlResponse}
      />,
      this.element
    )
  }

  scroll2bottom () {
    setTimeout(function () {
    }, 0)
  }
}

module.exports = Terminal
