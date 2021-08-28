
export const registerCommandAction = (name, command, activate, dispatch) => {
  const commands: any = {}
  const _commands: any = {}
  _commands[name] = command
  const data: any = {
    // lineLength: props.options.lineLength || 80,
    session: [],
    activeFilters: { commands: {}, input: '' },
    filterFns: {}
  }
  const _INDEX = {
    all: [],
    allMain: [],
    commands: {},
    commandsMain: {}
  }

  const registerFilter = (commandName, filterFn) => {
    data.filterFns[commandName] = filterFn
  }

  // const _appendItem = (item) => {
  //   var { el, gidx } = item
  //   _JOURNAL[gidx] = item
  //   if (!_jobs.length) {
  //     requestAnimationFrame(function updateTerminal () {
  //       _jobs.forEach(el => _view.journal.appendChild(el))
  //       .scroll2bottom()
  //       ._jobs = []
  //     })
  //   }
  //   if (data.activeFilters.commands[item.cmd]) _jobs.push(el)
  // }

  commands[name] = function () {
    const args = [...arguments]
    const steps = []
    const root = { steps, cmd: name, gidx: 0, idx: 0 }
    const ITEM = { root, cmd: name }
    root.gidx = _INDEX.allMain.push(ITEM) - 1
    // root.idx = _INDEX.commandsMain[name].push(ITEM) - 1
    let item
    function append (cmd, params, el) {
      if (cmd) { // subcommand
        item = { el, cmd, root }
      } else { // command
        item = ITEM
        item.el = el
        cmd = name
      }
      item.gidx = _INDEX.all.push(item) - 1
      item.idx = _INDEX.commands[cmd].push(item) - 1
      item.step = steps.push(item) - 1
      item.args = params
      // _appendItem(item)
      // self._appendItem(item)
    }
    var scopedCommands = _scopeCommands(append)
    command(args, scopedCommands, el => append(null, args, blockify(el)))
  }
  const help = typeof command.help === 'string' ? command.help : [
    '// no help available for:', `terminal.command.${name}`
  ].join('\n')
  commands[name].toString = () => { return help }
  commands[name].help = help
  data.activeFilters.commands[name] = activate && activate.activate
  if (activate.filterFn) {
    registerFilter(name, activate.filterFn)
  }
  if (name !== ('knownTransaction' || 'unkownTransaction' || 'emptyBlock')) {
    dispatch({ type: name, payload: { commands: commands, _commands: _commands, data: data } })
  }
  const blockify = (el) => {
    return `<div class="px-4 block_2A0YE0" data-id="block_null">${el}</div>`
  }

  const _scopeCommands = (append) => {
    const scopedCommands = {}
    Object.keys(commands).forEach(function makeScopedCommand (cmd) {
      var command = _commands[cmd]
      scopedCommands[cmd] = function _command () {
        var args = [...arguments]
        command(args, scopedCommands, el => append(cmd, args, blockify(el)))
      }
    })
    return scopedCommands
  }
}

export const filterFnAction = (name, filterFn, dispatch) => {
  const data: any = {
    // session: [],
    // activeFilters: { commands: {}, input: '' },
    filterFns: {}
  }
  data.filterFns[name] = filterFn
  dispatch({ type: name, payload: { data: data } })
}

export const registerLogScriptRunnerAction = (event, commandName, commandFn, dispatch) => {
  event.on('scriptRunner', commandName, (msg) => {
    commandFn.log.apply(commandFn, msg.data)
    dispatch({ type: commandName, payload: { commandFn, message: msg.data } })
  })
}

export const registerInfoScriptRunnerAction = (event, commandName, commandFn, dispatch) => {
  event.on('scriptRunner', commandName, (msg) => {
    commandFn.info.apply(commandFn, msg.data)
    dispatch({ type: commandName, payload: { commandFn, message: msg.data } })
  })
}

export const registerWarnScriptRunnerAction = (event, commandName, commandFn, dispatch) => {
  event.on('scriptRunner', commandName, (msg) => {
    commandFn.warn.apply(commandFn, msg.data)
    dispatch({ type: commandName, payload: { commandFn, message: msg.data } })
  })
}

export const registerErrorScriptRunnerAction = (event, commandName, commandFn, dispatch) => {
  event.on('scriptRunner', commandName, (msg) => {
    commandFn.error.apply(commandFn, msg.data)
    dispatch({ type: commandName, payload: { commandFn, message: msg.data } })
  })
}

export const registerRemixWelcomeTextAction = (welcomeText, dispatch) => {
  dispatch({ type: 'welcomeText', payload: { welcomeText } })
}

export const listenOnNetworkAction = async (props, isListening) => {
  props.event.trigger('listenOnNetWork', [isListening])
}

export const initListeningOnNetwork = (props, dispatch) => {
  props.txListener.event.register('newBlock', (block) => {
    if (!block.transactions || (block.transactions && !block.transactions.length)) {
      dispatch({ type: 'emptyBlock', payload: { message: 0 } })
    }
  })
  props.txListener.event.register('knownTransaction', (block) => {
    console.log({ block }, ' is call transaction test')
  })
  props.txListener.event.register('newCall', (tx, receipt) => {
    log(props, tx, receipt, dispatch)
    // log(this, tx, null)
  })
  props.txListener.event.register('newTransaction', (tx, receipt) => {
    log(props, tx, receipt, dispatch)
  })

  const log = async (props, tx, receipt, dispatch) => {
    const resolvedTransaction = await props.txListener.resolvedTransaction(tx.hash)
    if (resolvedTransaction) {
      var compiledContracts = null
      if (props._deps.compilersArtefacts.__last) {
        compiledContracts = await props._deps.compilersArtefacts.__last.getContracts()
      }
      await props.eventsDecoder.parseLogs(tx, resolvedTransaction.contractName, compiledContracts, async (error, logs) => {
        if (!error) {
          await dispatch({ type: 'knownTransaction', payload: { message: [{ tx: tx, receipt: receipt, resolvedData: resolvedTransaction, logs: logs }] } })
        }
      })
    } else {
      // contract unknown - just displaying raw tx.
      // logUnknownTX({ tx: tx, receipt: receipt })
      await dispatch({ type: 'unknownTransaction', payload: { message: [{ tx: tx, receipt: receipt }] } })
    }
  }

  props.txListener.event.register('debuggingRequested', async (hash) => {
    // TODO should probably be in the run module
    if (!await props.options.appManager.isActive('debugger')) await props.options.appManager.activatePlugin('debugger')
    props.thisState.call('menuicons', 'select', 'debugger')
    props.thisState.call('debugger', 'debug', hash)
  })
}
