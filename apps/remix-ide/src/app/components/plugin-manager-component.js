/* eslint-disable no-debugger */
/* eslint-disable no-unused-vars */
import {
  IframePlugin,
  ViewPlugin,
  WebsocketPlugin
} from '@remixproject/engine-web'
import { PluginManagerSettings } from './plugin-manager-settings'
import React from 'react' // eslint-disable-line
import ReactDOM from 'react-dom'
import {RemixUiPluginManager} from '@remix-ui/plugin-manager' // eslint-disable-line
import * as packageJson from '../../../../../package.json'
const yo = require('yo-yo')
const csjs = require('csjs-inject')
const EventEmitter = require('events')
const LocalPlugin = require('./local-plugin') // eslint-disable-line
const addToolTip = require('../ui/tooltip')
const _paq = window._paq = window._paq || []

const profile = {
  name: 'pluginManager',
  displayName: 'Plugin manager',
  methods: [],
  events: [],
  icon: 'assets/img/pluginManager.webp',
  description: 'Start/stop services, modules and plugins',
  kind: 'settings',
  location: 'sidePanel',
  documentation: 'https://remix-ide.readthedocs.io/en/latest/plugin_manager.html',
  version: packageJson.version
}

class PluginManagerComponent extends ViewPlugin {
  constructor (appManager, engine) {
    super(profile)
    // this.event = new EventEmitter() // already exists in engine so not needed here
    this.appManager = appManager
    this.engine = engine
    this.pluginManagerSettings = new PluginManagerSettings()
    this.htmlElement = document.createElement('div')
    this.htmlElement.setAttribute('id', 'pluginManager')
    this.views = {
      root: null,
      items: {}
    }
    this.localPlugin = new LocalPlugin()
    this.filter = ''
    this.pluginNames = this.appManager.actives
    this.activePlugins = []
    this.inactivePlugins = []
    this.activeProfiles = this.appManager.actives
    this._paq = _paq
  }

  triggerEngineEventListener () {
    this.engine.event.on('onRegistration', () => this.renderComponent())
  }

  /**
   * Checks and returns true or false if plugin name
   * passed in exists in the actives string array in
   * RemixAppManager
   * @param {string} name name of Plugin
   */
  isActive (name) {
    this.appManager.actives.includes(name)
  }

  /**
   * Delegates to method activatePlugin in
   * RemixAppManager to enable plugin activation
   * @param {string} name name of Plugin
   */
  activateP (name) {
    this.appManager.activatePlugin(name)
    this.appManager.event.on('activate', () => {
      this.getAndFilterPlugins()
      this.triggerEngineEventListener()
    })
    _paq.push(['trackEvent', 'manager', 'activate', name])
  }

  /**
   * Calls and triggers the event deactivatePlugin
   * with with manager permission passing in the name
   * of the plugin
   * @param {string} name name of Plugin
   */
  deactivateP (name) {
    console.log('deactivateP has just been called')
    this.call('manager', 'deactivatePlugin', name)
    this.appManager.event.on('deactivate', () => {
      console.log('this.call HAS JUST BEEN CALLED')
      this.getAndFilterPlugins()
      console.log('GETANDFILTERPLUGINS HAS JUST BEEN CALLED!')
      this.triggerEngineEventListener()
      console.log('TRIGGERENGINEEVENTLISTENER HAS JUST BEEN CALLED')
    })
    _paq.push(['trackEvent', 'manager', 'deactivate', name])
    console.log('MATOMO TRACKING IS DONE!')
  }

  onActivation () {
    // this.getAndFilterPlugins()
    this.renderComponent()
  }

  renderComponent () {
    ReactDOM.render(
      <RemixUiPluginManager
        pluginComponent={this}
        activePlugins={this.activePlugins}
        inactivePlugins={this.inactivePlugins}
      />,
      document.getElementById('pluginManager'))
  }

  /***************
   * SUB-COMPONENT
   */
  /**
   * Add a local plugin to the list of plugins
   */
  async openLocalPlugin () {
    try {
      const profile = await this.localPlugin.open(this.appManager.getAll())
      if (!profile) return
      if (this.appManager.getIds().includes(profile.name)) {
        throw new Error('This name has already been used')
      }
      const plugin = profile.type === 'iframe' ? new IframePlugin(profile) : new WebsocketPlugin(profile)
      this.engine.register(plugin)
      await this.appManager.activatePlugin(plugin.name)
    } catch (err) {
      // TODO : Use an alert to handle this error instead of a console.log
      console.log(`Cannot create Plugin : ${err.message}`)
      addToolTip(`Cannot create Plugin : ${err.message}`)
    }
  }

  render () {
    return this.htmlElement
  }

  getAndFilterPlugins (filter) {
    this.filter = filter ? filter.toLowerCase() : this.filter

    const isFiltered = (profile) => (profile.displayName ? profile.displayName : profile.name).toLowerCase().includes(this.filter)
    const isNotRequired = (profile) => !this.appManager.isRequired(profile.name)
    const isNotDependent = (profile) => !this.appManager.isDependent(profile.name)
    const isNotHome = (profile) => profile.name !== 'home'
    const sortByName = (profileA, profileB) => {
      const nameA = ((profileA.displayName) ? profileA.displayName : profileA.name).toUpperCase()
      const nameB = ((profileB.displayName) ? profileB.displayName : profileB.name).toUpperCase()
      return (nameA < nameB) ? -1 : (nameA > nameB) ? 1 : 0
    }
    const activatedPlugins = []
    const deactivatedPlugins = []
    const tempArray = this.appManager.getAll()
      .filter(isFiltered)
      .filter(isNotRequired)
      .filter(isNotDependent)
      .filter(isNotHome)
      .sort(sortByName)

    tempArray.forEach(profile => {
      if (this.appManager.actives.includes(profile.name)) {
        activatedPlugins.push(profile)
      } else {
        deactivatedPlugins.push(profile)
      }
    })
    this.activePlugins = activatedPlugins
    this.inactivePlugins = deactivatedPlugins
    this.renderComponent()
  }
}

module.exports = PluginManagerComponent
