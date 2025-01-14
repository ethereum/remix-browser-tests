import { StatusEvents } from '@remixproject/plugin-utils'
import { JsonDataRequest, JsonDataResult } from '../types/rpc'

export interface IDesktopClient {
  events: {
    connected: (connected: boolean) => void,
  } & StatusEvents
  methods: {
    init(): void
    sendAsync(payload: JsonDataRequest): Promise<JsonDataResult>
  }

}
