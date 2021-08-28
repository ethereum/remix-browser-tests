import React, { useState, useEffect, useReducer, useRef, SyntheticEvent, MouseEvent } from 'react' // eslint-disable-line
import { useKeyPress } from './custom-hooks/useKeyPress' // eslint-disable-line
import { useWindowResize } from 'beautiful-react-hooks'
import { registerCommandAction, registerLogScriptRunnerAction, registerInfoScriptRunnerAction, registerErrorScriptRunnerAction, registerWarnScriptRunnerAction, listenOnNetworkAction, initListeningOnNetwork } from './actions/terminalAction'
import { initialState, registerCommandReducer, addCommandHistoryReducer, registerScriptRunnerReducer } from './reducers/terminalReducer'
import { remixWelcome } from './reducers/remixWelcom' // eslint-disable-line
import { getKeyOf, getValueOf, Objectfilter, matched } from './utils/utils'
import {allCommands, allPrograms} from './commands' // eslint-disable-line
import { CopyToClipboard } from '@remix-ui/clipboard' // eslint-disable-line
import { ModalDialog } from '@remix-ui/modal-dialog' // eslint-disable-line
import TerminalWelcomeMessage from './terminalWelcome' // eslint-disable-line

import './remix-ui-terminal.css'
// const TxLogger from '../../../apps/'
import vm from 'vm'
import javascriptserialize from 'javascript-serialize'
import jsbeautify from 'js-beautify'
import helper from '../../../../../apps/remix-ide/src/lib/helper'

const remixLib = require('@remix-project/remix-lib')
var typeConversion = remixLib.execution.typeConversion

/* eslint-disable-next-line */
export interface RemixUiTerminalProps {
  propterties: any
  event: any
  autoCompletePopupEvent: any
  autoCompletePopup: any
  blockchain: any
  api: any
  options: any
  data: any
  cmdInterpreter: any
  command: any
  version: any
  config: any
  thisState: any
  vm: any
  commandHelp: any,
  _deps: any,
  fileImport: any,
  gistHandler: any,
  sourceHighlighter: any,
  registry: any,
  commands: any,
  txListener: any,
  eventsDecoder: any,
  logHtml: any
}

export interface ClipboardEvent<T = Element> extends SyntheticEvent<T, any> {
  clipboardData: DataTransfer;
}

export const RemixUiTerminal = (props: RemixUiTerminalProps) => {
  const [toggleDownUp, setToggleDownUp] = useState('fa-angle-double-down')
  const [_cmdIndex, setCmdIndex] = useState(-1)
  const [_cmdTemp, setCmdTemp] = useState('')
  // const [_cmdHistory, setCmdHistory] = useState([])
  const [, setWindowHeight] = useState(window.innerHeight)
  // dragable state
  const [leftHeight, setLeftHeight] = useState<undefined | number>(undefined)
  const [separatorYPosition, setSeparatorYPosition] = useState<undefined | number>(undefined)
  const [dragging, setDragging] = useState(false)

  const [newstate, dispatch] = useReducer(registerCommandReducer, initialState)
  const [cmdHistory, cmdHistoryDispatch] = useReducer(addCommandHistoryReducer, initialState)
  const [, scriptRunnerDispatch] = useReducer(registerScriptRunnerReducer, initialState)
  const [, setIsListeningOnNetwork] = useState(false)
  const [clearConsole, setClearConsole] = useState(false)
  const [paste, setPaste] = useState(false)
  const [autoCompletState, setAutoCompleteState] = useState({
    activeSuggestion: 0,
    data: {
      _options: []
    },
    _startingElement: 0,
    autoCompleteSelectedItem: {},
    _elementToShow: 4,
    _selectedElement: 0,
    filteredCommands: [],
    filteredPrograms: [],
    showSuggestions: false,
    text: '',
    userInput: '',
    extraCommands: [],
    commandHistoryIndex: 0
  })

  const [searchInput, setSearchInput] = useState('')
  // const [showTableDetails, setShowTableDetails] = useState([])
  const [showTableHash, setShowTableHash] = useState([])

  useWindowResize(() => {
    setWindowHeight(window.innerHeight)
  })

  // terminal inputRef
  const inputEl = useRef(null)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scriptRunnerDispatch({ type: 'html', payload: { message: props.logHtml } })
  }, [props.logHtml])

  console.log({ logHtml: props.logHtml })
  // events
  useEffect(() => {
    initListeningOnNetwork(props, scriptRunnerDispatch)
    registerLogScriptRunnerAction(props.thisState, 'log', newstate.commands, scriptRunnerDispatch)
    registerInfoScriptRunnerAction(props.thisState, 'info', newstate.commands, scriptRunnerDispatch)
    registerWarnScriptRunnerAction(props.thisState, 'warn', newstate.commands, scriptRunnerDispatch)
    registerErrorScriptRunnerAction(props.thisState, 'error', newstate.commands, scriptRunnerDispatch)
    registerCommandAction('html', _blocksRenderer('html'), { activate: true }, dispatch)
    registerCommandAction('log', _blocksRenderer('log'), { activate: true }, dispatch)
    registerCommandAction('info', _blocksRenderer('info'), { activate: true }, dispatch)
    registerCommandAction('warn', _blocksRenderer('warn'), { activate: true }, dispatch)
    registerCommandAction('error', _blocksRenderer('error'), { activate: true }, dispatch)

    registerCommandAction('script', function execute (args, scopedCommands) {
      var script = String(args[0])
      console.log({ script }, 'script')
      _shell(script, scopedCommands, function (error, output) {
        if (error) scriptRunnerDispatch({ type: 'error', payload: { message: error } })
        if (output) scriptRunnerDispatch({ type: 'script', payload: { message: '5' } })
      })
    }, { activate: true }, dispatch)
  }, [props.thisState.autoCompletePopup, autoCompletState.text])

  useEffect(() => {
    scrollToBottom()
    console.log({ messagesEndRef: messagesEndRef.current }, ' onScroll')
  }, [newstate.journalBlocks.length, props.logHtml.length])

  function execute (file, cb) {
    console.log('called execute scriptRunner')
    function _execute (content, cb) {
      if (!content) {
      //  toolTip('no content to execute')
        if (cb) cb()
        return
      }
      newstate.commands.script(content)
    }

    if (typeof file === 'undefined') {
      var content = props._deps.editor.currentContent()
      _execute(content, cb)
      return
    }

    var provider = props._deps.fileManager.fileProviderOf(file)

    if (!provider) {
      // toolTip(`provider for path ${file} not found`)
      if (cb) cb()
      return
    }

    provider.get(file, (error, content) => {
      if (error) {
        // toolTip(error)
        // TODO: pop up
        if (cb) cb()
        return
      }

      _execute(content, cb)
    })
    return ''
  }

  function loadgist (id, cb) {
    props.gistHandler.loadFromGist({ gist: id }, props._deps.fileManager)
    if (cb) cb()
  }

  const _shell = async (script, scopedCommands, done) => { // default shell
    if (script.indexOf('remix:') === 0) {
      return done(null, 'This type of command has been deprecated and is not functionning anymore. Please run remix.help() to list available commands.')
    }
    if (script.indexOf('remix.') === 0) {
      // we keep the old feature. This will basically only be called when the command is querying the "remix" object.
      // for all the other case, we use the Code Executor plugin
      const context = { remix: { exeCurrent: () => { return execute(undefined, undefined) }, loadgist: (id: any) => { return loadgist(id, () => {}) } } }
      try {
        const cmds = vm.createContext(context)
        const result = vm.runInContext(script, cmds)
        console.log(done, ' done func')
        return done(null, result)
      } catch (error) {
        return done(error.message)
      }
    }
    try {
      console.log(' remix command by david 2')
      let result: any
      if (script.trim().startsWith('git')) {
        // result = await this.call('git', 'execute', script)
      } else {
        console.log(' remix command by david 3')
        result = await props.thisState.call('scriptRunner', 'execute', script)

        console.log({ result }, ' me ')
      }
      console.log({ result })
      done()
    } catch (error) {
      done(error.message || error)
    }
  }

  const handleMinimizeTerminal = (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (toggleDownUp === 'fa-angle-double-down') {
      console.log('clikced down')
      setToggleDownUp('fa-angle-double-up')
      props.event.trigger('resize', [])
    } else {
      const terminalTopOffset = props.config.config.get('terminal-top-offset')
      props.event.trigger('resize', [terminalTopOffset])
      setToggleDownUp('fa-angle-double-down')
    }
  }

  const focusinput = () => {
    inputEl.current.focus()
  }

  const wrapScript = (script) => {
    const isKnownScript = ['remix.', 'git'].some(prefix => script.trim().startsWith(prefix))
    if (isKnownScript) return script
    return `
        try {
          const ret = ${script};
          if (ret instanceof Promise) {
            ret.then((result) => { console.log(result) }).catch((error) => { console.log(error) })
          } else {
            console.log(ret)
          }   
        } catch (e) {
          console.log(e.message)
        }
        `
  }

  const handleKeyDown = (event) => {
    const suggestionCount = autoCompletState.activeSuggestion
    if (autoCompletState.userInput !== '' && (event.which === 27 || event.which === 8 || event.which === 46)) {
      // backspace or any key that should remove the autocompletion
      setAutoCompleteState(prevState => ({ ...prevState, showSuggestions: false }))
    }
    if (autoCompletState.showSuggestions && (event.which === 13 || event.which === 9)) {
      if (autoCompletState.userInput.length === 1) {
        setAutoCompleteState(prevState => ({ ...prevState, activeSuggestion: 0, showSuggestions: false, userInput: Object.keys(autoCompletState.data._options[0]).toString() }))
      } else {
        console.log(autoCompletState.activeSuggestion, 'autoCompletState.userInput.length')
        setAutoCompleteState(prevState => ({ ...prevState, activeSuggestion: 0, showSuggestions: false, userInput: inputEl.current.value }))
      }
      console.log({ autoCompletState }, 'autoCompletState')
    }
    if (event.which === 13 && !autoCompletState.showSuggestions) {
      if (event.ctrlKey) { // <ctrl+enter>
        // on enter, append the value in the cli input to the journal
        inputEl.current.focus()
      } else { // <enter>
        event.preventDefault()
        setCmdIndex(-1)
        setCmdTemp('')
        const script = autoCompletState.userInput.trim() // inputEl.current.innerText.trim()
        if (script.length) {
          cmdHistoryDispatch({ type: 'cmdHistory', payload: { script } })
          newstate.commands.script(wrapScript(script))
        }
        setAutoCompleteState(prevState => ({ ...prevState, userInput: '' }))
        inputEl.current.innerText = ''
        inputEl.current.focus()
        setAutoCompleteState(prevState => ({ ...prevState, showSuggestions: false }))
      }
    } else if (newstate._commandHistory.length && event.which === 38 && !autoCompletState.showSuggestions && (autoCompletState.userInput === '')) {
      console.log('previous command up')
      // if (autoCompletState.commandHistoryIndex < 1) {
      event.preventDefault()
      console.log(newstate._commandHistory[0], ' up value')
      setAutoCompleteState(prevState => ({ ...prevState, userInput: newstate._commandHistory[0] }))
    } else if (event.which === 38 && autoCompletState.showSuggestions) {
      event.preventDefault()
      if (autoCompletState.activeSuggestion === 0) {
        return
      }
      setAutoCompleteState(prevState => ({ ...prevState, activeSuggestion: suggestionCount - 1, userInput: Object.keys(autoCompletState.data._options[autoCompletState.activeSuggestion]).toString() }))
      console.log({ autoCompletState }, 'disable up an down key in input box')
    } else if (event.which === 38 && !autoCompletState.showSuggestions) { // <arrowUp>
      // const len = _cmdHistory.length
      // if (len === 0) event.preventDefault()
      if (cmdHistory.length - 1 > _cmdIndex) {
        setCmdIndex(prevState => prevState++)
      }
      // console.log({ _cmdIndex }, 'history')
      inputEl.current.innerText = cmdHistory[_cmdIndex]
      inputEl.current.focus()
    } else if (event.which === 40 && autoCompletState.showSuggestions) {
      event.preventDefault()
      if ((autoCompletState.activeSuggestion + 1) === autoCompletState.data._options.length) {
        return
      }
      setAutoCompleteState(prevState => ({ ...prevState, activeSuggestion: suggestionCount + 1, userInput: Object.keys(autoCompletState.data._options[autoCompletState.activeSuggestion + 1]).toString() }))
    } else if (event.which === 40 && !autoCompletState.showSuggestions) {
      if (_cmdIndex > -1) {
        setCmdIndex(prevState => prevState--)
      }
      inputEl.current.innerText = _cmdIndex >= 0 ? cmdHistory[_cmdIndex] : _cmdTemp
      inputEl.current.focus()
    } else {
      setCmdTemp(inputEl.current.innerText)
    }
  }

  /* start of mouse events */

  const mousedown = (event: MouseEvent) => {
    setSeparatorYPosition(event.clientY)
    setDragging(true)
  }

  const onMouseMove: any = (e: MouseEvent) => {
    e.preventDefault()
    if (dragging && leftHeight && separatorYPosition) {
      // const newEditorHeight = leftHeight - e.clientY + separatorYPosition
      const newLeftHeight = leftHeight + separatorYPosition - e.clientY
      setSeparatorYPosition(e.clientY)
      setLeftHeight(newLeftHeight)
      props.event.trigger('resize', [newLeftHeight + 32])
    }
  }

  const onMouseUp = () => {
    setDragging(false)
  }

  /* end of mouse event */

  useEffect(() => {
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)

    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  })

  React.useEffect(() => {
    const leftRef = document.getElementById('terminal-view')
    // const editorRef = document.getElementById('mainPanelPluginsContainer-id')
    if (leftRef) {
      if (!leftHeight) {
        setLeftHeight(leftRef.offsetHeight)
        return
      }
      leftRef.style.height = `${leftHeight}px`
    }
  }, [leftHeight, setLeftHeight, inputEl])

  /* block contents that gets rendered from scriptRunner */

  const _blocksRenderer = (mode) => {
    if (mode === 'html') {
      return function logger (args) {
        if (args.length) {
          return args[0]
        }
      }
    }
    mode = {
      log: 'text-log',
      info: 'text-info',
      warn: 'text-warning',
      error: 'text-danger'
    }[mode] // defaults

    if (mode) {
      const filterUndefined = (el) => el !== undefined && el !== null
      return function logger (args) {
        var types = args.filter(filterUndefined).map(type => type)
        var values = javascriptserialize.apply(null, args.filter(filterUndefined)).map(function (val, idx) {
          if (typeof args[idx] === 'string') {
            const el = document.createElement('div')
            el.innerHTML = args[idx].replace(/(\r\n|\n|\r)/gm, '<br>')
            val = el.children.length === 0 ? el.firstChild : el
          }
          if (types[idx] === 'element') val = jsbeautify.html(val)
          return val
        })
        if (values.length) {
          return `<span class="${mode}" >${values}</span>`
        }
      }
    } else {
      throw new Error('mode is not supported')
    }
  }

  /* end of block content that gets rendered from script Runner */

  const handleClearConsole = () => {
    setClearConsole(true)
    dispatch({ type: 'clearconsole', payload: [] })
    inputEl.current.focus()
  }
  /* start of autoComplete */

  const listenOnNetwork = (event: any) => {
    const isListening = event.target.checked
    setIsListeningOnNetwork(isListening)
    listenOnNetworkAction(props, isListening)
  }

  const onChange = (event: any) => {
    event.preventDefault()
    const inputString = event.target.value
    if (matched(allPrograms, inputString) || inputString.includes('.')) {
      if (paste) {
        setPaste(false)
        setAutoCompleteState(prevState => ({ ...prevState, showSuggestions: false, userInput: inputString }))
      } else {
        setAutoCompleteState(prevState => ({ ...prevState, showSuggestions: true, userInput: inputString }))
      }
      const textList = inputString.split('.')
      if (textList.length === 1) {
        setAutoCompleteState(prevState => ({ ...prevState, data: { _options: [] } }))
        const result = Objectfilter(allPrograms, autoCompletState.userInput)
        setAutoCompleteState(prevState => ({ ...prevState, data: { _options: result } }))
      } else {
        setAutoCompleteState(prevState => ({ ...prevState, data: { _options: [] } }))
        const result = Objectfilter(allCommands, autoCompletState.userInput)
        setAutoCompleteState(prevState => ({ ...prevState, data: { _options: result } }))
      }
    } else {
      setAutoCompleteState(prevState => ({ ...prevState, showSuggestions: false, userInput: inputString }))
    }
  }

  const handleSelect = (event) => {
    const suggestionCount = autoCompletState.activeSuggestion
    if (event.keyCode === 38) {
      if (autoCompletState.activeSuggestion === 0) {
        return
      }
      setAutoCompleteState(prevState => ({ ...prevState, activeSuggestion: suggestionCount - 1 }))
    } else if (event.keyCode === 40) {
      if (autoCompletState.activeSuggestion - 1 === autoCompletState.data._options.length) {
        return
      }
      setAutoCompleteState(prevState => ({ ...prevState, activeSuggestion: suggestionCount + 1 }))
    }
    // props.thisState.event.trigger('handleSelect', [text])
  }

  const checkTxStatus = (tx, type) => {
    if (tx.status === '0x1' || tx.status === true) {
      return (<i className='txStatus succeeded fas fa-check-circle'></i>)
    }
    if (type === 'call' || type === 'unknownCall' || type === 'unknown') {
      return (<i className='txStatus call'>call</i>)
    } else if (tx.status === '0x0' || tx.status === false) {
      return (<i className='txStatus failed fas fa-times-circle'></i>)
    } else {
      return (<i className='txStatus notavailable fas fa-circle-thin' title='Status not available' ></i>)
    }
  }

  const context = (opts, blockchain) => {
    const data = opts.tx || ''
    const from = opts.from ? helper.shortenHexData(opts.from) : ''
    let to = opts.to
    if (data.to) to = to + ' ' + helper.shortenHexData(data.to)
    const val = data.value
    let hash = data.hash ? helper.shortenHexData(data.hash) : ''
    const input = data.input ? helper.shortenHexData(data.input) : ''
    const logs = data.logs && data.logs.decoded && data.logs.decoded.length ? data.logs.decoded.length : 0
    const block = data.receipt ? data.receipt.blockNumber : data.blockNumber || ''
    const i = data.receipt ? data.transactionIndex : data.transactionIndex
    const value = val ? typeConversion.toInt(val) : 0
    if (blockchain.getProvider() === 'vm') {
      return (
        <div>
          <span className='txLog_7Xiho'>
            <span className='tx'>[vm]</span>
            <div className='txItem'><span className='txItemTitle'>from:</span> {from}</div>
            <div className='txItem'><span className='txItemTitle'>to:</span> {to}</div>
            <div className='txItem'><span className='txItemTitle'>value:</span> {value} wei</div>
            <div className='txItem'><span className='txItemTitle'>data:</span> {input}</div>
            <div className='txItem'><span className='txItemTitle'>logs:</span> {logs}</div>
            <div className='txItem'><span className='txItemTitle'>hash:</span> {hash}</div>
          </span>
        </div>)
    } else if (blockchain.getProvider() !== 'vm' && data.resolvedData) {
      return (
        <div>
          <span className='txLog_7Xiho'>
            <span className='tx'>[block:{block} txIndex:{i}]</span>
            <div className='txItem'><span className='txItemTitle'>from:</span> {from}</div>
            <div className='txItem'><span className='txItemTitle'>to:</span> {to}</div>
            <div className='txItem'><span className='txItemTitle'>value:</span> {value} wei</div>
            <div className='txItem'><span className='txItemTitle'>data:</span> {input}</div>
            <div className='txItem'><span className='txItemTitle'>logs:</span> {logs}</div>
            <div className='txItem'><span className='txItemTitle'>hash:</span> {hash}</div>
          </span>
        </div>)
    } else {
      to = helper.shortenHexData(to)
      hash = helper.shortenHexData(data.blockHash)
      return (
        <div>
          <span className='txLog'>
            <span className='tx'>[block:{block} txIndex:{i}]</span>
            <div className='txItem'><span className='txItemTitle'>from:</span> {from}</div>
            <div className='txItem'><span className='txItemTitle'>to:</span> {to}</div>
            <div className='txItem'><span className='txItemTitle'>value:</span> {value} wei</div>
          </span>
        </div>)
    }
  }

  const txDetails = (event, tx) => {
    if (showTableHash.includes(tx.hash)) {
      const index = showTableHash.indexOf(tx.hash)
      if (index > -1) {
        setShowTableHash((prevState) => prevState.filter((x) => x !== tx.hash))
      }
    } else {
      setShowTableHash((prevState) => ([...prevState, tx.hash]))
    }
  }

  const showTable = (opts) => {
    let msg = ''
    let toHash
    const data = opts.data // opts.data = data.tx
    if (data.to) {
      toHash = opts.to + ' ' + data.to
    } else {
      toHash = opts.to
    }
    let callWarning = ''
    if (opts.isCall) {
      callWarning = '(Cost only applies when called by a contract)'
    }
    if (!opts.isCall) {
      if (opts.status !== undefined && opts.status !== null) {
        if (opts.status === '0x0' || opts.status === false) {
          msg = 'Transaction mined but execution failed'
        } else if (opts.status === '0x1' || opts.status === true) {
          msg = 'Transaction mined and execution succeed'
        }
      } else {
        msg = 'Status not available at the moment'
      }
    }

    let stringified = ' - '
    if (opts.logs && opts.logs.decoded) {
      stringified = typeConversion.stringify(opts.logs.decoded)
    }
    const val = opts.val != null ? typeConversion.toInt(opts.val) : 0
    return (
      <table className={`txTable ${showTableHash.includes(opts.hash) ? 'active' : ''}`} id='txTable' data-id={`txLoggerTable${opts.hash}`}>
        <tr className='tr'>
          <td className='td' data-shared={`key_${opts.hash}`}> status </td>
          <td className='td' data-id={`txLoggerTableStatus${opts.hash}`} data-shared={`pair_${opts.hash}`}>{`${opts.status} ${msg}`}</td>
        </tr>)
        {opts.hash && (<tr className='tr'>
          <td className='td' data-shared={`key_${opts.hash}`}> transaction hash </td>
          <td className='td' data-id={`txLoggerTableHash${opts.hash}`} data-shared={`pair_${opts.hash}`}>{opts.hash}
            <CopyToClipboard content={opts.hash}/>
          </td>
        </tr>) }
        {
          opts.contractAddress && (
            <tr className='tr'>
              <td className='td' data-shared={`key_${opts.hash}`}> contract address </td>
              <td className='td' data-id={`txLoggerTableContractAddress${opts.hash}`} data-shared={`pair_${opts.hash}`}>{opts.contractAddress}
                <CopyToClipboard content={opts.contractAddress}/>
              </td>
            </tr>
          )
        }
        {
          opts.from && (
            <tr className='tr'>
              <td className='td tableTitle' data-shared={`key_${opts.hash}`}> from </td>
              <td className='td' data-id={`txLoggerTableFrom${opts.hash}`} data-shared={`pair_${opts.hash}`}>{opts.from}
                <CopyToClipboard content={opts.from}/>
              </td>
            </tr>
          )
        }
        {
          opts.to && (
            <tr className='tr'>
              <td className='td' data-shared={`key_${opts.hash}`}> to </td>
              <td className='td' data-id={`txLoggerTableTo${opts.hash}`} data-shared={`pair_${opts.hash}`}>{toHash}
                <CopyToClipboard content={data.to ? data.to : toHash}/>
              </td>
            </tr>
          )
        }
        {
          opts.gas && (
            <tr className='tr'>
              <td className='td' data-shared={`key_${opts.hash}`}> gas </td>
              <td className='td' data-id={`txLoggerTableGas${opts.hash}`} data-shared={`pair_${opts.hash}`}>{opts.gas} gas
                <CopyToClipboard content={opts.gas}/>
              </td>
            </tr>
          )
        }
        {
          opts.transactionCost && (
            <tr className='tr'>
              <td className='td' data-shared={`key_${opts.hash}`}> transaction cost </td>
              <td className='td' data-id={`txLoggerTableTransactionCost${opts.hash}`} data-shared={`pair_${opts.hash}`}>{opts.transactionCost} gas {callWarning}
                <CopyToClipboard content={opts.transactionCost}/>
              </td>
            </tr>
          )
        }
        {
          opts.executionCost && (
            <tr className='tr'>
              <td className='td' data-shared={`key_${opts.hash}`}> execution cost </td>
              <td className='td' data-id={`txLoggerTableExecutionHash${opts.hash}`} data-shared={`pair_${opts.hash}`}>{opts.executionCost} gas {callWarning}
                <CopyToClipboard content={opts.executionCost}/>
              </td>
            </tr>
          )
        }
        {opts.hash && (
          <tr className='tr'>
            <td className='td' data-shared={`key_${opts.hash}`}> hash </td>
            <td className='td' data-id={`txLoggerTableHash${opts.hash}`} data-shared={`pair_${opts.hash}`}>{opts.hash}
              <CopyToClipboard content={opts.hash}/>
            </td>
          </tr>
        )}
        {opts.input && (
          <tr className='tr'>
            <td className='td' data-shared={`key_${opts.hash}`}> input </td>
            <td className='td' data-id={`txLoggerTableHash${opts.hash}`} data-shared={`pair_${opts.hash}`}>{helper.shortenHexData(opts.input)}
              <CopyToClipboard content={opts.input}/>
            </td>
          </tr>
        )}
        {opts['decoded input'] && (
          <tr className='tr'>
            <td className='td' data-shared={`key_${opts.hash}`}> decoded input </td>
            <td className='td' data-id={`txLoggerTableHash${opts.hash}`} data-shared={`pair_${opts.hash}`}>{opts['decoded input'].trim()}
              <CopyToClipboard content={opts['decoded input']}/>
            </td>
          </tr>
        )}
        {opts['decoded output'] && (
          <tr className='tr'>
            <td className='td' data-shared={`key_${opts.hash}`}> decoded output </td>
            <td className='td' data-id={`txLoggerTableHash${opts.hash}`} data-shared={`pair_${opts.hash}`}>{opts['decoded output']}
              <CopyToClipboard content={opts['decoded output']}/>
            </td>
          </tr>
        )}
        {opts.logs && (
          <tr className='tr'>
            <td className='td' data-shared={`key_${opts.hash}`}> logs </td>
            <td className='td' data-id={`txLoggerTableHash${opts.hash}`} data-shared={`pair_${opts.hash}`}>
              {JSON.stringify(stringified, null, '\t')}
              <CopyToClipboard content={JSON.stringify(stringified, null, '\t')}/>
              <CopyToClipboard content={JSON.stringify(opts.logs.raw || '0')}/>
            </td>
          </tr>
        )}
        {opts.val && (
          <tr className='tr'>
            <td className='td' data-shared={`key_${opts.hash}`}> val </td>
            <td className='td' data-id={`txLoggerTableHash${opts.hash}`} data-shared={`pair_${opts.hash}`}>{val} wei
              <CopyToClipboard content={`${val} wei`}/>
            </td>
          </tr>
        )}
      </table>
    )
  }

  const debug = (event, tx) => {
    event.stopPropagation()
    if (tx.isCall && tx.envMode !== 'vm') {
      return (<ModalDialog
        hide={false}
        handleHide={() => {} }
        message="Cannot debug this call. Debugging calls is only possible in JavaScript VM mode."
      />)
    } else {
      props.event.trigger('debuggingRequested', [tx.hash])
    }
  }

  const renderUnKnownTransactions = (tx, receipt, index) => {
    const from = tx.from
    const to = tx.to
    // const obj = { from, to }
    const txType = 'unknown' + (tx.isCall ? 'Call' : 'Tx')
    return (
      <span id={`tx${tx.hash}`} key={index}>
        <div className="log" onClick={(event) => txDetails(event, tx)}>
          {checkTxStatus(receipt || tx, txType)}
          {context({ from, to, tx }, props.blockchain)}
          <div className='buttons'>
            <div className='debug btn btn-primary btn-sm' data-shared='txLoggerDebugButton' data-id={`txLoggerDebugButton${tx.hash}`} onClick={(event) => debug(event, tx)}>Debug</div>
          </div>
          <i className = {`arrow fas ${(showTableHash.includes(tx.hash)) ? 'fa-angle-up' : 'fa-angle-down'}`}></i>
        </div>
        {showTableHash.includes(tx.hash) ? showTable({
          hash: tx.hash,
          status: receipt !== null ? receipt.status : null,
          isCall: tx.isCall,
          contractAddress: tx.contractAddress,
          data: tx,
          from,
          to,
          gas: tx.gas,
          input: tx.input,
          'decoded output': ' - ',
          val: tx.value,
          transactionCost: tx.transactionCost,
          executionCost: tx.executionCost
        }) : null}
      </span>
    )
  }

  const renderKnownTransactions = (tx, receipt, resolvedData, logs, index) => {
    const from = tx.from
    const to = resolvedData.contractName + '.' + resolvedData.fn
    // const obj = { from, to }
    const txType = 'knownTx'
    return (
      <span id={`tx${tx.hash}`} key={index}>
        <div className="log" onClick={(event) => txDetails(event, tx)}>
          {checkTxStatus(receipt, txType)}
          {context({ from, to, tx }, props.blockchain)}
          <div className='buttons'>
            <div className='debug btn btn-primary btn-sm' data-shared='txLoggerDebugButton' data-id={`txLoggerDebugButton${tx.hash}`} onClick={(event) => debug(event, tx)}>Debug</div>
          </div>
          <i className = {`arrow fas ${(showTableHash.includes(tx.hash)) ? 'fa-angle-up' : 'fa-angle-down'}`}></i>
        </div>
        {showTableHash.includes(tx.hash) ? showTable({
          hash: tx.hash,
          status: receipt !== null ? receipt.status : null,
          isCall: tx.isCall,
          contractAddress: tx.contractAddress,
          data: tx,
          from,
          to,
          gas: tx.gas,
          input: tx.input,
          'decoded input': resolvedData && resolvedData.params ? JSON.stringify(typeConversion.stringify(resolvedData.params), null, '\t') : ' - ',
          'decoded output': resolvedData && resolvedData.decodedReturnValue ? JSON.stringify(typeConversion.stringify(resolvedData.decodedReturnValue), null, '\t') : ' - ',
          logs: logs,
          val: tx.value,
          transactionCost: tx.transactionCost,
          executionCost: tx.executionCost
        }) : null}
      </span>
    )
  }

  const renderCall = (tx, resolvedData, logs, index) => {
    const to = resolvedData.contractName + '.' + resolvedData.fn
    const from = tx.from ? tx.from : ' - '
    const input = tx.input ? helper.shortenHexData(tx.input) : ''
    const txType = 'call'

    return (
      <span id={`tx${tx.hash}`} key={index}>
        <div className="log" onClick={(event) => txDetails(event, tx)}>
          {checkTxStatus(tx, txType)}
          <span className="txLog">
            <span className="tx">[call]</span>
            <div className='txItem'><span className='txItemTitle'>from:</span> {from}</div>
            <div className='txItem'><span className='txItemTitle'>to:</span> {to}</div>
            <div className='txItem'><span className='txItemTitle'>data:</span> {input}</div>
          </span>
          <div className='buttons'>
            <div className="debug btn btn-primary btn-sm" onClick={(event) => debug(event, tx)}>Debug</div>
          </div>
          <i className="arrow fas fa-angle-down"></i>
        </div>
        {showTableHash.includes(tx.hash) ? showTable({
          hash: tx.hash,
          isCall: tx.isCall,
          contractAddress: tx.contractAddress,
          data: tx,
          from,
          to,
          gas: tx.gas,
          input: tx.input,
          'decoded input': resolvedData && resolvedData.params ? JSON.stringify(typeConversion.stringify(resolvedData.params), null, '\t') : ' - ',
          'decoded output': resolvedData && resolvedData.decodedReturnValue ? JSON.stringify(typeConversion.stringify(resolvedData.decodedReturnValue), null, '\t') : ' - ',
          val: tx.value,
          logs: logs,
          transactionCost: tx.transactionCost,
          executionCost: tx.executionCost
        }) : null}
      </span>
    )
  }

  const handleAutoComplete = () => (
    <div className='popup alert alert-secondary' style={{ display: autoCompletState.showSuggestions && autoCompletState.userInput !== '' ? 'block' : 'none' }}>
      <div>
        {autoCompletState.data._options.map((item, index) => {
          return (
            <div key={index} data-id="autoCompletePopUpAutoCompleteItem" className={`autoCompleteItem listHandlerShow item ${autoCompletState.data._options[autoCompletState.activeSuggestion] === item ? 'border border-primary ' : ''}`} onKeyDown={ handleSelect } >
              <div>
                {getKeyOf(item)}
              </div>
              <div>
                {getValueOf(item)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
  /* end of autoComplete */

  const handlePaste = () => {
    setPaste(true)
    setAutoCompleteState(prevState => ({ ...prevState, activeSuggestion: 0, showSuggestions: false }))
  }

  return (
    <div style={{ height: '323px', flexGrow: 1 }} className='panel'>
      {console.log({ newstate })}
      {console.log({ _cmdIndex })}
      {console.log({ cmdHistory })}
      <div className="bar">
        {/* ${self._view.dragbar} */}
        <div className="dragbarHorizontal" onMouseDown={mousedown} id='dragId'></div>
        <div className="menu border-top border-dark bg-light" data-id="terminalToggleMenu">
          {/* ${self._view.icon} */}
          <i className={`mx-2 toggleTerminal fas ${toggleDownUp}`} data-id="terminalToggleIcon" onClick={ handleMinimizeTerminal }></i>
          <div className="mx-2 console" id="clearConsole" data-id="terminalClearConsole" onClick={handleClearConsole} >
            <i className="fas fa-ban" aria-hidden="true" title="Clear console"
            ></i>
          </div>
          {/* ${self._view.pendingTxCount} */}
          <div className="mx-2" title='Pending Transactions'>0</div>
          <div className="verticalLine"></div>
          <div className="pt-1 h-80 mx-3 align-items-center listenOnNetwork custom-control custom-checkbox">
            <input
              className="custom-control-input"
              id="listenNetworkCheck"
              onChange={listenOnNetwork}
              type="checkbox"
              title="If checked Remix will listen on all transactions mined in the current environment and not only transactions created by you"
            />
            <label
              className="pt-1 form-check-label custom-control-label text-nowrap"
              title="If checked Remix will listen on all transactions mined in the current environment and not only transactions created by you"
              htmlFor="listenNetworkCheck"
            >
              listen on network
            </label>
          </div>
          <div className="search">
            <i className="fas fa-search searchIcon bg-light" aria-hidden="true"></i>
            {/* ${self._view.inputSearch} */}
            <input
              // spellcheck = "false"
              onChange={(event) => setSearchInput(event.target.value.trim()) }
              type="text"
              className="border filter form-control"
              id="searchInput"
              // onkeydown=${filter}
              placeholder="Search with transaction hash or address"
              data-id="terminalInputSearch" />
          </div>
        </div>
      </div>
      <div tabIndex={-1} className="terminal_container" data-id="terminalContainer" >
        {
          handleAutoComplete()
        }
        <div data-id='terminalContainerDisplay' style = {{
          position: 'absolute',
          height: '100%',
          width: '100%',
          opacity: '0.1',
          zIndex: -1
        }}></div>
        <div className="terminal">
          <div id='journal' className='journal' data-id='terminalJournal'>
            {!clearConsole && <TerminalWelcomeMessage packageJson={props.version}/>}
            {newstate.journalBlocks && newstate.journalBlocks.map((x, index) => {
              if (x.name === 'emptyBlock') {
                return (
                  <div className="px-4 block" data-id='block_null' key={index}>
                    <span className='txLog'>
                      <span className='tx'><div className='txItem'>[<span className='txItemTitle'>block:{x.message} - </span> 0 {'transactions'} ] </div></span></span>
                  </div>
                )
              } else if (x.name === 'unknownTransaction') {
                return x.message.filter(x => x.tx.hash.includes(searchInput) || x.tx.from.includes(searchInput) || (x.tx.to.includes(searchInput))).map((trans) => {
                  return (<div className='px-4 block' data-id={`block_tx${trans.tx.hash}`} key={index}> {renderUnKnownTransactions(trans.tx, trans.receipt, index)} </div>)
                })
              } else if (x.name === 'knownTransaction') {
                return x.message.map((trans) => {
                  console.log({ trans }, ' resolveData')
                  return (<div className='px-4 block' data-id={`block_tx${trans.tx.hash}`} key={index}> { trans.tx.isCall ? renderCall(trans.tx, trans.resolvedData, trans.logs, index) : renderKnownTransactions(trans.tx, trans.receipt, trans.resolvedData, trans.logs, index)} </div>)
                })
              } else {
                return x.message.map((x, i) => {
                  return (
                    <div className="px-4 block" data-id="block_null" key={i}>{ x }</div>
                  )
                })
              }
            })}
            <div ref={messagesEndRef} />
          </div>
          <div id="terminalCli" data-id="terminalCli" className="cli" onClick={focusinput}>
            <span className="prompt">{'>'}</span>
            <input className="input" ref={inputEl} spellCheck="false" contentEditable="true" id="terminalCliInput" data-id="terminalCliInput" onChange={(event) => onChange(event)} onKeyDown={(event) => handleKeyDown(event) } value={autoCompletState.userInput} onPaste={handlePaste}></input>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RemixUiTerminal
