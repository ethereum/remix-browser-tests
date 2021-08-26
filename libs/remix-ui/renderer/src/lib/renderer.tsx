import React, { useEffect, useState } from 'react' //eslint-disable-line
import './renderer.css'
interface RendererProps {
  message: any;
  opt?: any,
  plugin: any,
}

export const Renderer = ({ message, opt = {}, plugin }: RendererProps) => {
  const [messageText, setMessageText] = useState(null)
  const [editorOptions, setEditorOptions] = useState({
    useSpan: false,
    type: '',
    errFile: ''
  })
  const [classList] = useState(opt.type === 'error' ? 'alert alert-danger' : 'alert alert-warning')
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
    const positionDetails = getPositionDetails(text)

    opt.errLine = positionDetails.errLine
    opt.errCol = positionDetails.errCol
    opt.errFile = positionDetails.errFile ? (positionDetails.errFile as string).trim() : ''

    if (!opt.noAnnotations && opt.errFile && opt.errFile !== '') {
      addAnnotation(opt.errFile, {
        row: opt.errLine,
        column: opt.errCol,
        text: text,
        type: opt.type
      })
    }

    setMessageText(text)
    setEditorOptions(opt)
    setClose(false)
  }, [message, opt])

  const getPositionDetails = (msg: string) => {
    const result = { } as Record<string, number | string>

    // To handle some compiler warning without location like SPDX license warning etc
    if (!msg.includes(':')) return { errLine: -1, errCol: -1, errFile: '' }

    if (msg.includes('-->')) msg = msg.split('-->')[1].trim()

    // extract line / column
    let pos = msg.match(/^(.*?):([0-9]*?):([0-9]*?)?/)
    result.errLine = pos ? parseInt(pos[2]) - 1 : -1
    result.errCol = pos ? parseInt(pos[3]) : -1

    // extract file
    pos = msg.match(/^(https:.*?|http:.*?|.*?):/)
    result.errFile = pos ? pos[1] : msg
    return result
  }

  const addAnnotation = (file, error) => {
    if (file === plugin.getConfiguration('currentFile')) {
      plugin.call('editor', 'addAnnotation', error, file)
    }
  }

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

  const _errorClick = (errFile, errLine, errCol) => {
    if (errFile !== plugin.getConfiguration('currentFile')) {
      // TODO: refactor with this._components.contextView.jumpTo
      const provider = plugin.fileProviderOf(errFile)
      if (provider) {
        provider.exists(errFile).then(() => {
          plugin.open(errFile)
          plugin.call('editor', 'gotoLine', errLine, errCol)
        }).catch(error => {
          if (error) return console.log(error)
        })
      }
    } else {
      plugin.call('editor', 'gotoLine', errLine, errCol)
    }
  }

  return (
    <>
      {
        messageText && !close && (
          <div className={`sol ${editorOptions.type} ${classList}`} data-id={editorOptions.errFile} onClick={() => handleErrorClick(editorOptions)}>
            { editorOptions.useSpan ? <span> { messageText } </span> : <pre><span>{ messageText }</span></pre> }
            <div className="close" data-id="renderer" onClick={handleClose}>
              <i className="fas fa-times"></i>
            </div>
          </div>)
      }
    </>
  )
}
