import { compiler_list } from 'circom_wasm'
import { Dispatch } from 'react'
import type { NoirPluginClient } from '../services/noirPluginClient'

export interface INoirAppContext {
  // appState: AppState
//   dispatch: Dispatch<Actions>,
  plugin: NoirPluginClient
}

export interface AppState {
  version: string,
  versionList: typeof compiler_list.wasm_builds,
  filePath: string,
  filePathToId: Record<string, string>,
  autoCompile: boolean,
  hideWarnings: boolean
}
