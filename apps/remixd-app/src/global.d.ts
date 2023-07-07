export interface IElectronAPI {
  startRemixd: (path: string) => Promise<void>,
  stopRemixd: () => Promise<void>,
  startWithFolder: (path: string) => Promise<void>,
  setUrl(url: string): Promise<void>,
  readCache: () => Promise<void>,
  exitApp: () => Promise<void>
}

declare global {
  interface Window {
    electronAPI: IElectronAPI
  }
}