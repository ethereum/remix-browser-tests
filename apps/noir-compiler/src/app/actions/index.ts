import { NoirPluginClient } from "../services/noirPluginClient"
import { AppState } from "../types"

export const compileNoirCircuit = async (plugin: NoirPluginClient, appState: AppState) => {
  try {
    if (appState.status !== "compiling") {
      await plugin.compile(appState.filePath)
    } else {
      console.log('Existing noir compilation in progress')
    }
  } catch (e) {
    plugin.emit('statusChanged', { key: 'error', title: e.message, type: 'error' })
    plugin.internalEvents.emit('noir_compiling_errored', e)
    console.error(e)
  }
}