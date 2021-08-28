
export const initialState = {
  journalBlocks: [
  ],
  data: {
    // lineLength: props.options.lineLength || 80,
    session: [],
    activeFilters: { commands: {}, input: '' },
    filterFns: {}
  },
  _commandHistory: [],
  _commands: {},
  commands: {},
  _JOURNAL: [],
  _jobs: [],
  _INDEX: {
  },
  _INDEXall: [],
  _INDEXallMain: [],
  _INDEXcommands: {},
  _INDEXcommandsMain: {},
  message: []
}

export const registerCommandReducer = (state, action) => {
  switch (action.type) {
    case 'html' :
      return {
        ...state,
        _commands: Object.assign(initialState._commands, action.payload._commands),
        commands: Object.assign(initialState.commands, action.payload.commands),
        data: Object.assign(initialState.data, { ...action.payload.data })
      }
    case 'log':
      return {
        ...state,
        _commands: Object.assign(initialState._commands, action.payload._commands),
        commands: Object.assign(initialState.commands, action.payload.commands),
        data: Object.assign(initialState.data, { ...action.payload.data })

      }
    case 'info':
      return {
        ...state,
        _commands: Object.assign(initialState._commands, action.payload._commands),
        commands: Object.assign(initialState.commands, action.payload.commands),
        data: Object.assign(initialState.data, action.payload.data)
      }
    case 'warn':
      return {
        ...state,
        _commands: Object.assign(initialState._commands, action.payload._commands),
        commands: Object.assign(initialState.commands, action.payload.commands),
        data: Object.assign(initialState.data, action.payload.data)
      }
    case 'error':
      return {
        ...state,
        _commands: Object.assign(initialState._commands, action.payload._commands),
        commands: Object.assign(initialState.commands, action.payload.commands),
        data: Object.assign(initialState.data, action.payload.data)
      }
    case 'script':
      return {
        ...state,
        _commands: Object.assign(initialState._commands, action.payload._commands),
        commands: Object.assign(initialState.commands, action.payload.commands),
        data: Object.assign(initialState.data, action.payload.data)
      }
    case 'clearconsole':
      return {
        ...state,
        ...state.journalBlocks.splice(0)
      }
    case 'listenOnNetWork':
      console.log({ action: action.payload })
      return {
        ...state,
        journalBlocks: initialState.journalBlocks.push({ message: action.payload.message, style: 'text-info' })
      }
    default :
      return { state }
  }
}

export const registerFilterReducer = (state, action) => {
  switch (action.type) {
    case 'log':
      return {
        ...state,
        data: Object.assign(initialState.data.filterFns, action.payload.data.filterFns)

      }
    case 'info':
      return {
        ...state,
        data: Object.assign(initialState.data.filterFns, action.payload.data.filterFns)
      }
    case 'warn':
      return {
        ...state,
        data: Object.assign(initialState.data.filterFns, action.payload.data.filterFns)
      }
    case 'error':
      return {
        ...state,
        data: Object.assign(initialState.data.filterFns, action.payload.data.filterFns)
      }
    case 'script':
      return {
        ...state,
        data: Object.assign(initialState.data.filterFns, action.payload.data.filterFns)
      }
    default :
      return { state }
  }
}

export const addCommandHistoryReducer = (state, action) => {
  switch (action.type) {
    case 'cmdHistory':
      console.log({ action }, { state }, 'cmd history')
      return {
        ...state,
        _commandHistory: initialState._commandHistory.unshift(action.payload.script)

      }
    default :
      return { state }
  }
}

export const remixWelcomeTextReducer = (state, action) => {
  switch (action.type) {
    case 'welcomeText' :
      return {
        ...state,
        journalBlocks: initialState.journalBlocks.push(action.payload.welcomeText)
      }
  }
}

export const registerScriptRunnerReducer = (state, action) => {
  switch (action.type) {
    case 'html':
      return {
        ...state,
        journalBlocks: initialState.journalBlocks.push({ message: action.payload.message, style: 'text-log' })
      }
    case 'log':
      return {
        ...state,
        journalBlocks: initialState.journalBlocks.push({ message: action.payload.message, style: 'text-info' })
      }
    case 'info':
      return {
        ...state,
        journalBlocks: initialState.journalBlocks.push({ message: action.payload.message, style: 'text-info' })
      }
    case 'warn':
      return {
        ...state,
        journalBlocks: initialState.journalBlocks.push({ message: action.payload.message, style: 'text-warning' })
      }
    case 'error':
      return {
        ...state,
        journalBlocks: initialState.journalBlocks.push({ message: action.payload.message, style: 'text-danger' })
      }
    case 'script':
      return {
        ...state,
        journalBlocks: initialState.journalBlocks.push({ message: action.payload.message, style: 'text-log' })
      }
    case 'knownTransaction':
      return {
        ...state,
        journalBlocks: initialState.journalBlocks.push({ message: action.payload.message, style: '', name: 'knownTransaction' })
      }
    case 'unknownTransaction':
      return {
        ...state,
        journalBlocks: initialState.journalBlocks.push({ message: action.payload.message, style: '', name: 'unknownTransaction' })
      }
    case 'emptyBlock':
      return {
        ...state,
        journalBlocks: initialState.journalBlocks.push({ message: action.payload.message, style: '', name: 'emptyBlock' })
      }
    case 'newTransaction':
      return {
        ...state,
        journalBlocks: initialState.journalBlocks.push({ message: action.payload.message, style: '' })
      }
  }
}
