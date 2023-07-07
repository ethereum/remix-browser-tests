// REMIXD CODE

import { Sharedfolder, SlitherClient, HardhatClient, FoundryClient, TruffleClient } from "@remix-project/remixd/src/serviceList"
import Websocket from '@remix-project/remixd/src/websocket'
import { RemixdClient } from "@remix-project/remixd/src/services/remixdClient"
import { ipcMain, dialog, app } from "electron"
import { existsSync } from "fs-extra"
import { readConfig, writeConfig } from "./config"
import { folderArg, isE2E, mainWindow } from "./index"
import os from 'os'
import fs from 'fs-extra'
import { appState } from "./state"

let remixIdeUrl = 'https://remix.ethereum.org/'
let folder = './'

const killCallBack: Array<any> = [] // any is function

ipcMain.handle('startRemixd', async (event, url) => {
  console.log('startRemixd', url)
  remixIdeUrl = url
  await openFileDialog()
  await setFolders()
  await remixdStart()
})

ipcMain.handle('startWithFolder', async (event, path: string) => {
  console.log('startWithFolder', path)
  folder = path
  await setFolders()
  await remixdStart()
})


ipcMain.handle('setUrl', async (event, path: string) => {
  console.log('setUrl', path)
  remixIdeUrl = path
})

ipcMain.handle('stopRemixd', async (event) => {
  console.log('stop remixd')
  await kill()

  for (const k in sockets) {
    appState.socketConnectionState[k].listening = false
    appState.socketConnectionState[k].connected = false
    appState.socketConnectionState[k].error = false
  }

  mainWindow.webContents.send('state', appState)
  mainWindow.webContents.send('message', 'Stopping remix connect....')
})

ipcMain.handle('exitApp', async (event) => {
  console.log('exit app')
  await kill()
  app.quit()
})


ipcMain.handle('readCache', async (event) => {
  const cache = readConfig()
  console.log('cache', cache)
  if (cache && cache.recentFolders) {
    appState.recentFolders = cache.recentFolders
    mainWindow.webContents.send('state', appState)
  }
})


// kill
async function kill() {
  for (const k in killCallBack) {
    try {
      await killCallBack[k]()
    } catch (e) {
      console.log(e)
    }
  }
}

process.on('SIGINT', kill) // catch ctrl-c
process.on('SIGTERM', kill) // catch kill
process.on('exit', kill)


let sharedFolderClient = new Sharedfolder()
let slitherClient = new SlitherClient()
let hardhatClient = new HardhatClient()
let foundryClient = new FoundryClient()
let truffleClient = new TruffleClient()


const sockets = {
  "folder": null,
  "hardhat": null,
  "slither": null,
  "truffle": null,
  "foundry": null
}

const services: any = {
  hardhat: () => {
    hardhatClient.options.customApi = {}
    return hardhatClient
  },
  slither: () => {
    slitherClient.options.customApi = {}
    return slitherClient
  },
  folder: () => {
    sharedFolderClient.options.customApi = {}
    return sharedFolderClient
  },
  truffle: () => {
    truffleClient.options.customApi = {}
    return truffleClient
  },
  foundry: () => {
    foundryClient.options.customApi = {}
    return foundryClient
  }
}

const openFileDialog = async () => {

  //if (socket) socket.close()

  if (isE2E) {
    folder = folderArg
  } else {

    // open local file dialog
    const { filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    if (filePaths.length > 0) {
      folder = filePaths[0]
    }

  }

}

const setFolders = async () => {
  appState.recentFolders = appState.recentFolders.filter((f) => f !== folder)
  appState.recentFolders.unshift(folder)

  // update the cache
  const cache = readConfig()
  if (cache) {
    cache.recentFolders = appState.recentFolders
    writeConfig(cache)
  }
  appState.currentFolder = folder
  mainWindow.webContents.send('state', appState)

  sharedFolderClient.sharedFolder(folder)
  sharedFolderClient.setupNotifications(folder)
  slitherClient.sharedFolder(folder)
  hardhatClient.sharedFolder(folder)
  foundryClient.sharedFolder(folder)
  truffleClient.sharedFolder(folder)
}


// Similar object is also defined in websocket.ts
const ports: any = {
  hardhat: 65522,
  slither: 65523,
  folder: 65520,
  truffle: 65524,
  foundry: 65525
}




function startService(service: string, callback: any) {
  try {
    console.log('starting websocket', service)
    const socket = new Websocket(ports[service], { remixIdeUrl }, () => services[service]())
    sockets[service] = socket
    socket.start(callback)
    killCallBack.push(socket.close.bind(socket))
    appState.socketConnectionState[service].listening = true
    mainWindow.webContents.send('state', appState)
  } catch (e) {
    console.error(e)
  }
}

// return either current folder in client, or the one in cache or by default the os homedir
function getFolder(client: { currentSharedFolder: any; }) {
  if (client.currentSharedFolder) return client.currentSharedFolder
  const cache = readConfig()
  if (cache) {
    try {
      const folder = cache.sharedFolder
      if (fs.existsSync(folder)) return folder
    } catch (e) {
    }
  }
  if (process.cwd()) {
    return process.cwd()
  } else
    return os.homedir()
}

let remixdStart = async () => {
  // electron GUI does not inherit the path from the terminal, this is a workaround

  console.log('start shared folder service')
  // send message to the renderer process
  mainWindow.webContents.send('message', `starting remix connect on ${remixIdeUrl} and shared folder ${folder}`)

  try {
    startService('folder', (ws: any, client: RemixdClient) => {
      console.log('start service folder')
      mainWindow.webContents.send('message', 'IDE connected to share folder')
      client.setWebSocket(ws)
      client.sharedFolder(getFolder(client))
      client.setupNotifications(getFolder(client))
      appState.socketConnectionState.folder.connected = true
      mainWindow.webContents.send('state', appState)
    })

    startService('slither', (ws: any, client: SlitherClient) => {
      console.log('start service slither')
      mainWindow.webContents.send('message', 'IDE connected to slither')
      client.setWebSocket(ws)
      client.sharedFolder(getFolder(client))
      appState.socketConnectionState.slither.connected = true
      mainWindow.webContents.send('state', appState)
    })

    const isHardhatProject = existsSync(folder + '/hardhat.config.js') || existsSync(folder + '/hardhat.config.ts')
    if (isHardhatProject) {
      startService('hardhat', (ws: any, client: HardhatClient) => {
        console.log('start service hardhat')
        mainWindow.webContents.send('message', 'IDE connected to hardhat')
        client.setWebSocket(ws)
        client.sharedFolder(getFolder(client))
        appState.socketConnectionState.hardhat.connected = true
        mainWindow.webContents.send('state', appState)
      })
    }

    const truffleConfigFilePath = folder + '/truffle-config.js'
    if (existsSync(truffleConfigFilePath)) {
      startService('truffle', (ws: any, client: TruffleClient) => {
        console.log('start service truffle')
        mainWindow.webContents.send('message', 'IDE connected to truffle')
        client.setWebSocket(ws)
        client.sharedFolder(getFolder(client))
        appState.socketConnectionState.truffle.connected = true
        mainWindow.webContents.send('state', appState)
      })
    }

    // Run foundry service if a founndry project is shared as folder

    const isFoundryProject = existsSync(folder + '/foundry.toml')
    if (isFoundryProject) {
      startService('foundry', (ws: any, client: FoundryClient) => {
        console.log('start service foundry')
        mainWindow.webContents.send('message', 'IDE connected to foundry')
        client.setWebSocket(ws)
        client.sharedFolder(getFolder(client))
        appState.socketConnectionState.foundry.connected = true
        mainWindow.webContents.send('state', appState)
      })
    }

  } catch (error) {
    throw new Error(error)
  }

}