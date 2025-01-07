import { PluginClient } from '@remixproject/plugin'
import { createClient } from '@remixproject/plugin-webview'
import EventManager from 'events'
import { loadPluginAction } from './actions'

export class ContractInteractionPluginClient extends PluginClient {
  public internalEvents: EventManager

  constructor() {
    super()
    this.internalEvents = new EventManager()
    createClient(this)
  }

  onActivation(): void {
    this.internalEvents.emit('interaction_activated')
  }

  loadPlugin = async () => {
    await loadPluginAction();
  }
}

export default new ContractInteractionPluginClient()
