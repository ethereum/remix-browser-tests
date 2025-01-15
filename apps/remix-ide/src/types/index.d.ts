export interface PluginProfile {
  name: string
  displayName: string
  description: string
  keywords?: string[]
  icon?: string
  url?: string
  methods?: string[]
  events?: string[]
  version?: string
}

export interface StatusBarInterface {
  htmlElement: HTMLDivElement
  events: EventEmitter
  filePanelPlugin: FilePanelType
  dispatch: React.Dispatch<any>
  setDispatch(dispatch: React.Dispatch<any>): void
}

type NavigatorUAData = {
  brands: Record<string, string>
  fullVersion: string
  mobile: boolean
  platform: string
  getHighEntropyValues: (options: string[]) => Promise<Record<string, {
    wow64: boolean,
    uaFullVersion: string,
    platformVersion: string,
    model: string,
    fullVersionList: Record<string, string>[]
    formFactor: string,
    bitness: string,
    architecture: string,
    platform: string,
    mobile: boolean,
    brands: Record<string, string>
  }>>
  toJson: () => string
}

export interface RemixNavigator extends Navigator {
  userAgentData: NavigatorUAData
}

export interface IRemixAppManager {
  actives: string[]
  pluginsDirectory: string
  event: EventEmitter
  pluginLoader: PluginLoader
  canActivatePlugin(from: any, to: any): Promise<boolean>
  canDeactivatePlugin(from: any, to: any): Promise<boolean>
  checkCanDeactivate(from: any, to: any): Promise<boolean>
  deactivatePlugin(name: string): Promise<void>
  canCall(from: string, to: string, method: string, message: string): Promise<boolean>
  onPluginActivated(plugin: any): void
  onPluginDeactivated(plugin: any): void
  getAll(): Profile<any>[]
  getIds(): string[]
  isDependent(name: string): boolean
  isRequired(name: string): boolean
  registeredPlugins(): Promise<any[]>
  registerContextMenuItems(): Promise<void>
}
