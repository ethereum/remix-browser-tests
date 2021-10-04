import React from 'react'
import { EMPTY_BLOCK, KNOWN_TRANSACTION, NEW_BLOCK, NEW_CALL, NEW_TRANSACTION, UNKNOWN_TRANSACTION } from '../types/terminalTypes'

export const registerCommandAction = (name: string, command, activate, dispatch: React.Dispatch<any>) => {
  const commands: any = {}
  const _commands: any = {}
  _commands[name] = command
  const data: any = {
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

  commands[name] = function () {
    const args = [...arguments]
    const steps = []
    const root = { steps, cmd: name, gidx: 0, idx: 0 }
    const ITEM = { root, cmd: name }
    root.gidx = _INDEX.allMain.push(ITEM) - 1
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
    }
    const scopedCommands = _scopeCommands(append)
    command(args, scopedCommands, el => append(null, args, el))
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
  if (name !== (KNOWN_TRANSACTION || UNKNOWN_TRANSACTION || EMPTY_BLOCK)) {
    dispatch({ type: name, payload: { commands: commands, _commands: _commands, data: data } })
  }

  const _scopeCommands = (append) => {
    const scopedCommands = {}
    Object.keys(commands).forEach(function makeScopedCommand (cmd) {
      const command = _commands[cmd]
      scopedCommands[cmd] = function _command () {
        const args = [...arguments]
        command(args, scopedCommands, el => append(cmd, args, el))
      }
    })
    return scopedCommands
  }
}

export const filterFnAction = (name: string, filterFn, dispatch: React.Dispatch<any>) => {
  const data: any = {
    filterFns: {}
  }
  data.filterFns[name] = filterFn
  dispatch({ type: name, payload: { data: data } })
}

export const registerLogScriptRunnerAction = (on, commandName, commandFn, dispatch: React.Dispatch<any>) => {
  on('scriptRunner', commandName, (msg) => {
    commandFn.log.apply(commandFn, msg.data)
    dispatch({ type: commandName, payload: { commandFn, message: msg.data } })
  })
}

export const registerInfoScriptRunnerAction = (on, commandName, commandFn, dispatch: React.Dispatch<any>) => {
  on('scriptRunner', commandName, (msg) => {
    commandFn.info.apply(commandFn, msg.data)
    dispatch({ type: commandName, payload: { commandFn, message: msg.data } })
  })
}

export const registerWarnScriptRunnerAction = (on, commandName, commandFn, dispatch: React.Dispatch<any>) => {
  on('scriptRunner', commandName, (msg) => {
    commandFn.warn.apply(commandFn, msg.data)
    dispatch({ type: commandName, payload: { commandFn, message: msg.data } })
  })
}

export const registerErrorScriptRunnerAction = (on, commandName, commandFn, dispatch: React.Dispatch<any>) => {
  on('scriptRunner', commandName, (msg) => {
    commandFn.error.apply(commandFn, msg.data)
    dispatch({ type: commandName, payload: { commandFn, message: msg.data } })
  })
}

export const listenOnNetworkAction = async (event, isListening) => {
  event.trigger('listenOnNetWork', [isListening])
}

export const initListeningOnNetwork = (props, dispatch: React.Dispatch<any>) => {
  props.txListener.event.register(NEW_BLOCK, (block) => {
    if (!block.transactions || (block.transactions && !block.transactions.length)) {
      dispatch({ type: EMPTY_BLOCK, payload: { message: 0 } })
    }
  })
  props.txListener.event.register(KNOWN_TRANSACTION, () => {
  })
  props.txListener.event.register(NEW_CALL, (tx, receipt) => {
    log(props, tx, receipt, dispatch)
    // log(this, tx, null)
  })
  props.txListener.event.register(NEW_TRANSACTION, (tx, receipt) => {
    log(props, tx, receipt, dispatch)
  })

  const log = async (props, tx, receipt, dispatch: React.Dispatch<any>) => {
    const resolvedTransaction = await props.txListener.resolvedTransaction(tx.hash)
    if (resolvedTransaction) {
      let compiledContracts = null
      if (props._deps.compilersArtefacts.__last) {
        compiledContracts = await props._deps.compilersArtefacts.__last.getContracts()
      }
      await props.eventsDecoder.parseLogs(tx, resolvedTransaction.contractName, compiledContracts, async (error, logs) => {
        if (!error) {
          await dispatch({ type: KNOWN_TRANSACTION, payload: { message: [{ tx: tx, receipt: receipt, resolvedData: resolvedTransaction, logs: logs }] } })
        }
      })
    } else {
      await dispatch({ type: UNKNOWN_TRANSACTION, payload: { message: [{ tx: tx, receipt: receipt }] } })
    }
  }

  props.txListener.event.register('debuggingRequested', async (hash) => {
    // TODO should probably be in the run module
    if (!await props.options.appManager.isActive('debugger')) await props.options.appManager.activatePlugin('debugger')
    props.call('menuicons', 'select', 'debugger')
    props.call('debugger', 'debug', hash)
  })
}
