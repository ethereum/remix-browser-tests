import { ElectronBasePlugin, ElectronBasePluginClient } from "@remixproject/plugin-electron"
import { Profile } from "@remixproject/plugin-utils"
import { handleRequest, startHostServer } from "../lib/server"
import EventEmitter from "events"
import { ipcMain, shell } from "electron"
import { RequestArguments } from "../types"

const profile = {
    displayName: 'desktopHost',
    name: 'desktopHost',
    description: 'desktopHost',
}

const eventEmitter = new EventEmitter()
let isConnected = false

let ports: {
    http_port: number
    websocket_port: number
}

export class DesktopHostPlugin extends ElectronBasePlugin {
    clients: DesktopHostPluginClient[] = []
    constructor() {
        super(profile, clientProfile, DesktopHostPluginClient)
        this.methods = [...super.methods]
        this.startServer()
        eventEmitter.on('connected', (payload) => {
            console.log('connected', payload)
            isConnected = payload
            if (!isConnected) {
                for (const client of this.clients) {
                    client.disconnect()
                }
            }
        })
        eventEmitter.on('focus', () => {
            console.log('focus')
            ipcMain.emit('focus-window', 0)
        })
        eventEmitter.on('contextChanged', (context) => {
            console.log('contextChanged', context)
            for (const client of this.clients) {
                client.emit('chainChanged', context)
            }
        })
    }

    async startServer(): Promise<void> {
        console.log('desktopHost activated')
        ports = await startHostServer(eventEmitter)
        console.log('desktopHost server started', ports)
    }
}

const clientProfile: Profile = {
    name: 'desktopHost',
    displayName: 'desktopHost',
    description: 'desktopHost',
    methods: ['getIsConnected', 'sendAsync', 'init'],
    kind: 'provider',
}

export class DesktopHostPluginClient extends ElectronBasePluginClient {
    constructor(webContentsId: number, profile: Profile) {
        super(webContentsId, profile)
    }

    getIsConnected() {
        console.log('getIsConnected', isConnected)
        return isConnected
    }

    async init() {
        console.log('initializing destkophost plugin...')
        
        if (!isConnected)
            await shell.openExternal(`http://localhost:${ports.http_port}/?activate=udapp,desktopClient&desktopClientPort=${ports.websocket_port}`)
        // wait for the connection
        while (!isConnected) {
            await new Promise(resolve => setTimeout(resolve, 1000))
        }
    }

    async disconnect() {
        this.call('notification' as any, 'alert', {
            id: 'Connection lost',
            message: 'You have been disconnected from Remix on the web. Please select another environment for deploy & run.',
        })
    }

    async sendAsync(data: RequestArguments) {
        //console.log('SEND ASYNC', data)
        const result = await handleRequest(data, eventEmitter)
        //console.log('RESULT from handleRequest', data, result)
        return result
    }
}