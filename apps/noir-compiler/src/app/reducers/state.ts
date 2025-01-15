import { Actions, AppState } from '../types'

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

  case 'SET_FILE_PATH':
    return {
      ...state,
      filePath: action.payload
    }

  default:
    throw new Error()
  }
}
