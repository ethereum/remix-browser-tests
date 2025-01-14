import { Actions, AppState } from '../types'

export interface ActionPayloadTypes {
    SET_AUTO_COMPILE: boolean,
    SET_HIDE_WARNINGS: boolean
}

export const appInitialState: AppState = {
  filePath: '',
  filePathToId: {},
  autoCompile: false,
  hideWarnings: false,
  status: 'idle'
}

export const appReducer = (state = appInitialState, action: Actions): AppState => {
  switch (action.type) {

  case 'SET_AUTO_COMPILE':
    return {
      ...state,
      autoCompile: action.payload
    }

  case 'SET_HIDE_WARNINGS':
    return {
      ...state,
      hideWarnings: action.payload
    }

  default:
    throw new Error()
  }
}
