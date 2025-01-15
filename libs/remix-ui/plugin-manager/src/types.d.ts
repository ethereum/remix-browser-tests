import { PermissionHandler } from './app/ui/permission-handler'
import { PluginManager } from '@remixproject/engine/lib/manager'
import { EventEmitter } from 'events'
import { Engine } from '@remixproject/engine/lib/engine'
import { PluginBase, Profile } from '@remixproject/plugin-utils'
import { IframePlugin, ViewPlugin, WebsocketPlugin } from '@remixproject/engine-web'
import { IframeReactPlugin } from '@remix-ui/app'
/* eslint-disable camelcase */

interface SetPluginOptionType {
  queueTimeout: number
}

export class RemixEngine extends Engine {
  event: EventEmitter
  setPluginOption ({ name, kind }) : SetPluginOptionType
  onRegistration (plugin) : void
}

export function isNative(name: any): any
/**
 * Checks if plugin caller 'from' is allowed to activate plugin 'to'
 * The caller can have 'canActivate' as an optional property in the plugin profile.
 * This is an array containing the 'name' property of the plugin it wants to call.
 * canActivate = ['plugin1-to-call','plugin2-to-call',....]
 * or the plugin is allowed by default because it is native
 *
 * @param {any, any}
 * @returns {boolean}
 */
export function canActivate(from: any, to: any): boolean
export class RemixAppManager extends PluginManager {
  constructor()
  event: EventEmitter
  pluginsDirectory: string
  pluginLoader: PluginLoader // eslint-disable-line no-use-before-define
  getAll(): import('@remixproject/plugin-utils').Profile<any>[]
  getIds(): string[]
  isDependent(name: any): any
  isRequired(name: any): any
  registeredPlugins(): Promise<any>
}

export class PluginManagerSettings {
  openDialog(): void
  permissions: any
  currentSetting: any
  onValidation(): void
  /** Clear one permission from a plugin */
  clearPermission(from: string, to: string, method: string): void
  /** Clear all permissions from a plugin */
  clearAllPermission(to: string): void
  settings(): any
  render(): any
}

export type PluginPermissions = {
  fileManager : {
    writeFile: {
      pluginName: {
        allow: boolean
      }
    }
  }
}

export class PluginManagerComponent extends ViewPlugin implements PluginBase {
  constructor(appManager: RemixAppManager, engine: Engine)
  appManager: RemixAppManager
  pluginSettings: PluginManagerSettings
  app: PluginApi<any> // eslint-disable-line no-undef
  engine: Engine
  htmlElement: HTMLDivElement
  views: { root: null, items: Record<any, any> }
  localPlugin: LocalPlugin // eslint-disable-line no-use-before-define
  pluginNames: string[]
  inactivePlugins: Profile[]
  activePlugins: Profile[]
  filter: string
  isActive(name: string): boolean
  activateP(name: string): void
  deactivateP(name: string): void
  onActivation(): void
  renderComponent(): void
  openLocalPlugin(): Promise<void>
  render(): HTMLDivElement
  getAndFilterPlugins: (filter?: string, profiles?: Profile[]) => void
  triggerEngineEventListener: () => void
  activateAndRegisterLocalPlugin: (localPlugin: IframePlugin | IframeReactPlugin | WebsocketPlugin) => Promise<void>
  activeProfiles: string[]
  _paq: any
}

// eslint-disable-next-line no-use-before-define
export = LocalPlugin
declare class LocalPlugin {
  /**
     * Open a modal to create a local plugin
     * @param {Profile[]} plugins The list of the plugins in the store
     * @returns {Promise<{api: any, profile: any}>} A promise with the new plugin profile
     */
  open(plugins: any[]): Promise<{
    api: any
    profile: any
  }>

  profile: any
  /**
     * Create the object to add to the plugin-list
     */
  create(): any
  updateName({ target }: {
    target: any
  }): void

  updateUrl({ target }: {
    target: any
  }): void

  updateDisplayName({ target }: {
    target: any
  }): void

  updateProfile(key: any, e: any): void
  updateMethods({ target }: {
    target: any
  }): void

  /** The form to create a local plugin */
  form(): any
}

export interface PluginManagerContextProviderProps {
  children: React.ReactNode // eslint-disable-line no-undef
  pluginComponent: PluginManagerComponent
}

export interface RemixUiPluginManagerProps {
  pluginComponent: PluginManagerComponent
  pluginManagerSettings?: PluginManagerSettings
}
/** @class Reference loaders.
 *  A loader is a get, set based object which load a workspace from a defined sources.
 *  (localStorage, queryParams)
 **/
declare class PluginLoader {
  get currentLoader(): any
  donotAutoReload: string[]
  loaders: Record<any, any>
  current: string
  set(plugin: any, actives: any): void
  get(): any
}

export interface DefaultLocalPlugin extends Profile {
  name: string
  displayName: string
  url: string
  type: string
  hash: string
  methods: any
  location: string
}

export interface FormStateProps {
  name: string
  displayName: string
  url: string
  type: 'iframe' | 'ws'
  hash: string
  methods: string[]
  location: string
  canActivate: string[]
}

export type PluginManagerProfile = Profile & {
  name: string,
  displayName: string,
  methods: Array<any>,
  events?: Array<any>,
  icon: 'assets/img/pluginManager.webp',
  description: string,
  kind?: string,
  location: 'sidePanel' | 'mainPanel' | 'none',
  documentation: 'https://remix-ide.readthedocs.io/en/latest/plugin_manager.html',
  version: any
  type: 'iframe' | 'ws'
  hash: string
}

export { }
