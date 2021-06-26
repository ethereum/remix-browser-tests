import React, { useState } from 'react'
import copy from 'copy-to-clipboard'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'

import './copy-to-clipboard.css'

export const CopyToClipboard = ({ content, tip = 'Copy', icon = 'fa-copy', direction = 'right', ...otherProps }) => {
  const [message, setMessage] = useState(tip)
  const handleClick = (e) => {
    if (content && content !== '') { // module `copy` keeps last copied thing in the memory, so don't show tooltip if nothing is copied, because nothing was added to memory
      try {
        if (typeof content !== 'string') {
          content = JSON.stringify(content, null, '\t')
        }
        copy(content)
        setMessage('Copied')
      } catch (e) {
        console.error(e)
      }
    } else {
      setMessage('Cannot copy empty content!')
    }
    e.preventDefault()
    return false
  }

  const reset = () => {
    setTimeout(() => setMessage('Copy'), 500)
  }

  return (
    <a href='#' onClick={handleClick} onMouseLeave={reset}>
      <OverlayTrigger placement="right" overlay={
        <Tooltip id="overlay-tooltip">
          { message }
        </Tooltip>
      }>
        <i className={`far ${icon} ml-1 p-2`} aria-hidden="true"
          {...otherProps}
        ></i>
      </OverlayTrigger>
    </a>
  )
}

export default CopyToClipboard
