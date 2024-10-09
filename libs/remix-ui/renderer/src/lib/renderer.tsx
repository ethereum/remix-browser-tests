import React, {useEffect, useState} from 'react' //eslint-disable-line
import { useIntl } from 'react-intl'
import { CopyToClipboard } from '@remix-ui/clipboard'
import { helper } from '@remix-project/remix-solidity'
import './renderer.css'
const _paq = (window._paq = window._paq || [])

interface RendererProps {
  message: any
  opt?: RendererOptions
  plugin: any
}

type RendererOptions = {
  useSpan?: boolean
  type: string
  errorType?: string
  errCol?: number
  errLine?: number
  errFile?: string
}

export const Renderer = ({ message, opt, plugin }: RendererProps) => {
  const intl = useIntl()
  const [messageText, setMessageText] = useState(null)
  const [editorOptions, setEditorOptions] = useState<RendererOptions>({
    useSpan: false,
    type: '',
    errorType: '',
    errCol: -1,
    errLine: -1,
    errFile: ''
  })
  const [classList, setClassList] = useState(opt.type === 'error' ? 'alert alert-danger' : 'alert alert-warning')
  const [close, setClose] = useState(false)

  useEffect(() => {
    if (!message) return
    let text

    if (typeof message === 'string') {
      text = message
    } else if (message.innerText) {
      text = message.innerText
    }

    // ^ e.g:
    // browser/gm.sol: Warning: Source file does not specify required compiler version! Consider adding "pragma solidity ^0.6.12
    // https://github.com/OpenZeppelin/openzeppelin-contracts/blob/release-v3.2.0/contracts/introspection/IERC1820Registry.sol:3:1: ParserError: Source file requires different compiler version (current compiler is 0.7.4+commit.3f05b770.Emscripten.clang) - note that nightly builds are considered to be strictly less than the released version

    if (!opt.errLine) {
      const positionDetails = helper.getPositionDetails(text)

      opt.errLine = positionDetails.errLine as number
      opt.errCol = positionDetails.errCol as number
      opt.errFile = positionDetails.errFile ? (positionDetails.errFile as string).trim() : ''
    }

    setMessageText(text)
    setEditorOptions(opt)
    setClose(false)
    setClassList(opt.type === 'error' ? 'alert alert-danger' : 'alert alert-warning')
  }, [message, opt])

  const handleErrorClick = (opt) => {
    if (opt.click) {
      opt.click(message)
    } else if (opt.errFile !== undefined && opt.errLine !== undefined && opt.errCol !== undefined) {
      _errorClick(opt.errFile, opt.errLine, opt.errCol)
    }
  }

  const handleClose = () => {
    setClose(true)
  }

  const _errorClick = async (errFile, errLine, errCol) => {
    if (errFile !== (await plugin.call('config', 'getAppParameter', 'currentFile'))) {
      // TODO: refactor with this._components.contextView.jumpTo
      if (await plugin.call('fileManager', 'exists', errFile)) {
        await plugin.call('fileManager', 'open', errFile)
        await plugin.call('editor', 'gotoLine', errLine, errCol)
      }
    } else {
      await plugin.call('editor', 'gotoLine', errLine, errCol)
    }
  }

  const askGtp = async () => {
    try {
      const content = await plugin.call('fileManager', 'readFile', editorOptions.errFile)
      const message = intl.formatMessage({ id: 'solidity.openaigptMessage' }, { content, messageText })
      await plugin.call('remixAI', 'error_explaining', message)
      _paq.push(['trackEvent', 'ai', 'remixAI', 'error_explaining_SolidityError'])
    } catch (err) {
      console.error('unable to askGtp')
      console.error(err)
    }
  }

  return (
    <>
      {messageText && !close && (
        <div className={`remixui_sol ${editorOptions.type} ${classList}`} data-id={editorOptions.errFile} onClick={() => handleErrorClick(editorOptions)}>
          {editorOptions.useSpan ? (
            <span> {messageText} </span>
          ) : (
            <pre>
              <span>{messageText}</span>
            </pre>
          )}
          <div className="close" data-id="renderer" onClick={handleClose}>
            <i className="fas fa-times"></i>
          </div>
          <div className="d-flex pt-1 flex-row-reverse">
            <span className="ml-3 pt-1 py-1" >
              <CopyToClipboard content={messageText} className={` p-0 m-0 far fa-copy ${classList}`} direction={'top'} />
            </span>
            <span
              className="position-relative text-ai text-sm pl-0 pr-2"
              style={{ fontSize: "x-small", alignSelf: "end" }}
            >
            </span>
            <span
              className="button border text-ai btn-sm"
              onClick={() => { askGtp() }}
              style={{ borderColor: "var(--ai)" }}
            >
              Ask RemixAI
            </span>

          </div>
        </div>
      )}
    </>
  )
}
