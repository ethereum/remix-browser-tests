import { compiler_list } from 'circom_wasm'
import { Dispatch } from 'react'
import type { NoirPluginClient } from '../services/noirPluginClient'
import { ActionPayloadTypes } from '../reducers/state'

export type CompilerStatus = "compiling" | "idle" | "errored" | "warning"
export interface INoirAppContext {
  appState: AppState
  dispatch: Dispatch<Actions>,
  plugin: NoirPluginClient
}

export interface AppState {
  filePath: string,
  filePathToId: Record<string, string>,
  autoCompile: boolean,
  hideWarnings: boolean,
  status: CompilerStatus
}

export interface Action<T extends keyof ActionPayloadTypes> {
  type: T
  payload: ActionPayloadTypes[T]
}

export type Actions = {[A in keyof ActionPayloadTypes]: Action<A>}[keyof ActionPayloadTypes]
