/* global localStorage, fetch */
import { PluginManager } from '@remixproject/engine'
import { IframePlugin } from '@remixproject/engine-web'
import { EventEmitter } from 'events'
import QueryParams from './lib/query-params'
import { PermissionHandler } from './app/ui/persmission-handler'
const _paq = window._paq = window._paq || []

const requiredModules = [ // services + layout views + system views
  'manager', 'compilerArtefacts', 'compilerMetadata', 'contextualListener', 'editor', 'offsetToLineColumnConverter', 'network', 'theme',
  'fileManager', 'contentImport', 'blockchain', 'web3Provider', 'scriptRunner', 'fetchAndCompile', 'mainPanel', 'hiddenPanel', 'sidePanel', 'menuicons',
  'filePanel', 'terminal', 'settings', 'pluginManager', 'tabs', 'udapp', 'dGitProvider', 'solidity-logic']

const dependentModules = ['git', 'hardhat'] // module which shouldn't be manually activated (e.g git is activated by remixd)

export function isNative (name) {
  const nativePlugins = ['vyper', 'workshops', 'debugger', 'remixd', 'menuicons', 'solidity', 'hardhat-provider']
  return nativePlugins.includes(name) || requiredModules.includes(name)
}

/**
 * Checks if plugin caller 'from' is allowed to activate plugin 'to'
 * The caller can have 'canActivate' as a optional property in the plugin profile.
 * This is an array containing the 'name' property of the plugin it wants to call.
 * canActivate = ['plugin1-to-call','plugin2-to-call',....]
 * or the plugin is allowed by default because it is native
 *
 * @param {any, any}
 * @returns {boolean}
 */
export function canActivate (from, to) {
  return ['ethdoc'].includes(from.name) ||
  isNative(from.name) ||
  (to && from && from.canActivate && from.canActivate.includes(to.name))
}

export class RemixAppManager extends PluginManager {
  constructor () {
    super()
    this.event = new EventEmitter()
    this.pluginsDirectory = 'https://raw.githubusercontent.com/ethereum/remix-plugins-directory/master/build/metadata.json'
    this.pluginLoader = new PluginLoader()
    this.permissionHandler = new PermissionHandler()
  }

  async canActivatePlugin (from, to) {
    return canActivate(from, to)
  }

  async canDeactivatePlugin (from, to) {
    if (requiredModules.includes(to.name)) return false
    return isNative(from.name)
  }

  async deactivatePlugin (name) {
    const [to, from] = [
      await this.getProfile(name),
      await this.getProfile(this.requestFrom)
    ]
    if (this.canDeactivatePlugin(from, to)) {
      await this.toggleActive(name)
    }
  }

  async canCall (from, to, method, message) {
    // Make sure the caller of this methods is the target plugin
    if (to !== this.currentRequest.from) {
      return false
    }
    // skipping native plugins' requests
    if (isNative(from)) {
      return true
    }
    // ask the user for permission
    return await this.permissionHandler.askPermission(this.profiles[from], this.profiles[to], method, message)
  }

  onPluginActivated (plugin) {
    this.pluginLoader.set(plugin, this.actives)
    this.event.emit('activate', plugin)
    if (!requiredModules.includes(plugin.name)) _paq.push(['trackEvent', 'pluginManager', 'activate', plugin.name])
  }

  getAll () {
    return Object.keys(this.profiles).map((p) => {
      return this.profiles[p]
    })
  }

  getIds () {
    return Object.keys(this.profiles)
  }

  onPluginDeactivated (plugin) {
    this.pluginLoader.set(plugin, this.actives)
    this.event.emit('deactivate', plugin)
    _paq.push(['trackEvent', 'pluginManager', 'deactivate', plugin.name])
  }

  isDependent (name) {
    return dependentModules.includes(name)
  }

  isRequired (name) {
    // excluding internal use plugins
    return requiredModules.includes(name)
  }

  async registeredPlugins () {
    let plugins
    try {
      const res = await fetch(this.pluginsDirectory)
      plugins = await res.json()
      plugins = plugins.filter((plugin) => {
        if (plugin.targets && Array.isArray(plugin.targets) && plugin.targets.length > 0) {
          return (plugin.targets.includes('remix'))
        }
        return true
      })
      // temp dgit hack
      for (const profile of plugins) {
        if (profile.name === 'dgit') {
          profile.url = 'https://dgit3remix.web.app/'
        }
      }
      const github = {
        name: 'dgitcompact',
        displayName: 'dGit Compact',
        methods: [],
        version: '0.0.1',
        documentation: 'https://github.com/bunsenstraat/remix-storage-plugin',
        url: 'https://dgit3remix.web.app/?compact',
        description: 'Manage workspaces in a git repository.',
        icon: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAxNi4wLjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB3aWR0aD0iOTdweCIgaGVpZ2h0PSI5N3B4IiB2aWV3Qm94PSIwIDAgOTcgOTciIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDk3IDk3IiB4bWw6c3BhY2U9InByZXNlcnZlIj4NCjxnPg0KCTxwYXRoIGZpbGw9IiNGMDUxMzMiIGQ9Ik05Mi43MSw0NC40MDhMNTIuNTkxLDQuMjkxYy0yLjMxLTIuMzExLTYuMDU3LTIuMzExLTguMzY5LDBsLTguMzMsOC4zMzJMNDYuNDU5LDIzLjE5DQoJCWMyLjQ1Ni0wLjgzLDUuMjcyLTAuMjczLDcuMjI5LDEuNjg1YzEuOTY5LDEuOTcsMi41MjEsNC44MSwxLjY3LDcuMjc1bDEwLjE4NiwxMC4xODVjMi40NjUtMC44NSw1LjMwNy0wLjMsNy4yNzUsMS42NzENCgkJYzIuNzUsMi43NSwyLjc1LDcuMjA2LDAsOS45NThjLTIuNzUyLDIuNzUxLTcuMjA4LDIuNzUxLTkuOTYxLDBjLTIuMDY4LTIuMDctMi41OC01LjExLTEuNTMxLTcuNjU4bC05LjUtOS40OTl2MjQuOTk3DQoJCWMwLjY3LDAuMzMyLDEuMzAzLDAuNzc0LDEuODYxLDEuMzMyYzIuNzUsMi43NSwyLjc1LDcuMjA2LDAsOS45NTljLTIuNzUsMi43NDktNy4yMDksMi43NDktOS45NTcsMGMtMi43NS0yLjc1NC0yLjc1LTcuMjEsMC05Ljk1OQ0KCQljMC42OC0wLjY3OSwxLjQ2Ny0xLjE5MywyLjMwNy0xLjUzN1YzNi4zNjljLTAuODQtMC4zNDQtMS42MjUtMC44NTMtMi4zMDctMS41MzdjLTIuMDgzLTIuMDgyLTIuNTg0LTUuMTQtMS41MTYtNy42OTgNCgkJTDMxLjc5OCwxNi43MTVMNC4yODgsNDQuMjIyYy0yLjMxMSwyLjMxMy0yLjMxMSw2LjA2LDAsOC4zNzFsNDAuMTIxLDQwLjExOGMyLjMxLDIuMzExLDYuMDU2LDIuMzExLDguMzY5LDBMOTIuNzEsNTIuNzc5DQoJCUM5NS4wMjEsNTAuNDY4LDk1LjAyMSw0Ni43MTksOTIuNzEsNDQuNDA4eiIvPg0KPC9nPg0KPC9zdmc+DQo=',
        location: 'sidePanel',
        canActivate: [
          'dGitProvider'
        ]
      }
      plugins.push(github)
      localStorage.setItem('plugins-directory', JSON.stringify(plugins))
    } catch (e) {
      console.log('getting plugins list from localstorage...')
      const savedPlugins = localStorage.getItem('plugins-directory')
      if (savedPlugins) {
        try {
          plugins = JSON.parse(savedPlugins)
        } catch (e) {
          console.error(e)
        }
      }
    }
    return plugins.map(plugin => {
      return new IframePlugin(plugin)
    })
  }

  async registerContextMenuItems () {
    await this.call('filePanel', 'registerContextMenuItem', {
      id: 'flattener',
      name: 'flattenFileCustomAction',
      label: 'Flatten',
      type: [],
      extension: ['.sol'],
      path: [],
      pattern: [],
      sticky: true
    })
    await this.call('filePanel', 'registerContextMenuItem', {
      id: 'optimism-compiler',
      name: 'compileCustomAction',
      label: 'Compile with Optimism',
      type: [],
      extension: ['.sol'],
      path: [],
      pattern: [],
      sticky: true
    })
  }
}

/** @class Reference loaders.
 *  A loader is a get,set based object which load a workspace from a defined sources.
 *  (localStorage, queryParams)
 **/
class PluginLoader {
  get currentLoader () {
    return this.loaders[this.current]
  }

  constructor () {
    const queryParams = new QueryParams()
    this.donotAutoReload = ['remixd', 'git'] // that would be a bad practice to force loading some plugins at page load.
    this.loaders = {}
    this.loaders.localStorage = {
      set: (plugin, actives) => {
        const saved = actives.filter((name) => !this.donotAutoReload.includes(name))
        localStorage.setItem('workspace', JSON.stringify(saved))
      },
      get: () => { return JSON.parse(localStorage.getItem('workspace')) }
    }

    this.loaders.queryParams = {
      set: () => {},
      get: () => {
        const { activate } = queryParams.get()
        if (!activate) return []
        return activate.split(',')
      }
    }

    this.current = queryParams.get().activate ? 'queryParams' : 'localStorage'
  }

  set (plugin, actives) {
    this.currentLoader.set(plugin, actives)
  }

  get () {
    return this.currentLoader.get()
  }
}
