const yo = require('yo-yo')
const css = require('./styles/debugger-tab-styles')
import toaster from '../ui/tooltip'
import { DebuggerUI } from '@remix-ui/debugger-ui'
import { ViewPlugin } from '@remixproject/engine'
import * as packageJson from '../../../../../package.json'
import React from 'react'
import ReactDOM from 'react-dom'

const profile = {
  name: 'debugger',
  displayName: 'Debugger',
  methods: ['debug', 'getTrace'],
  events: [],
  icon: 'assets/img/debuggerLogo.webp',
  description: 'Debug transactions',
  kind: 'debugging',
  location: 'sidePanel',
  documentation: 'https://remix-ide.readthedocs.io/en/latest/debugger.html',
  version: packageJson.version
}

class DebuggerTab extends ViewPlugin {

  constructor (blockchain, editor, offsettolinecolumnconverter) {
    super(profile)    
    this.el = null
    this.editor = editor
    this.offsetToLineColumnConverter = offsettolinecolumnconverter
    this.blockchain = blockchain
    this.debugHash = null
    this.removeHighlights = false
  }

  render () {
    if (this.el) return this.el

    this.el = yo`
      <div class="${css.debuggerTabView}" id="debugView">
        <div id="debugger" class="${css.debugger}"></div>
      </div>`

    this.on('fetchAndCompile', 'compiling', (settings) => {
      toaster(yo`<div><b>Recompiling and debugging with params</b><pre class="text-left">${JSON.stringify(settings, null, '\t')}</pre></div>`)
    })

    this.on('fetchAndCompile', 'compilationFailed', (data) => {
      toaster(yo`<div><b>Compilation failed...</b> continuing <i>without</i> source code debugging.</div>`)
    })

    this.on('fetchAndCompile', 'notFound', (contractAddress) => {
      toaster(yo`<div><b>Contract ${contractAddress} not found in source code repository</b> continuing <i>without</i> source code debugging.</div>`)
    })

    this.on('fetchAndCompile', 'usingLocalCompilation', (contractAddress) => {
      toaster(yo`<div><b>Using compilation result from Solidity module</b></div>`)
    })

    this.on('fetchAndCompile', 'sourceVerificationNotAvailable', () => {
      toaster(yo`<div><b>Source verification plugin not activated or not available.</b> continuing <i>without</i> source code debugging.</div>`)
    })

    this.renderComponent()

    this.call('manager', 'activatePlugin', 'source-verification').catch(e => console.log(e.message))
    // this.call('manager', 'activatePlugin', 'udapp')

    return this.el
  }

  renderComponent () {
    ReactDOM.render(
      <DebuggerUI debuggerModule={this} />
    , this.el)
  }

  deactivate () {
    this.removeHighlights = true
    this.renderComponent()
    super.deactivate()
  }

  debug (hash) {
    this.debugHash = hash
    this.renderComponent()
  }

  getTrace (hash) {
    this.getTraceHash = hash
    this.renderComponent()
  }

  // debugger () {
  //   return this.debuggerUI
  // }
}

module.exports = DebuggerTab
