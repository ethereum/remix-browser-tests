interface socketConnectionStateOptions {
  connected: boolean,
  listening: boolean,
  error: boolean
}

export type serviceStatus = { [name: string]: socketConnectionStateOptions }

export interface IAppState {
  socketConnectionState: serviceStatus
  recentFolders: string[]
  currentFolder: string
}

export const appState: IAppState = {
  socketConnectionState: {
    folder: {
      connected: false,
      listening: false,
      error: false
    },
    hardhat: {
      connected: false,
      listening: false,
      error: false
    },
    slither: {
      connected: false,
      listening: false,
      error: false
    },
    truffle: {
      connected: false,
      listening: false,
      error: false
    },
    foundry: {
      connected: false,
      listening: false,
      error: false
    }
  },
  recentFolders: [],
  currentFolder: ''
}