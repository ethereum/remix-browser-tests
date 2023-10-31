import { useState } from 'react'
import { FeedbackAlertProps } from '../types'
import { RenderIf } from '@remix-ui/helper'
import {CopyToClipboard} from '@remix-ui/clipboard'

export function FeedbackAlert ({ message, location }: FeedbackAlertProps) {
  const [ showAlert, setShowAlert] = useState<boolean>(true)

  const handleCloseAlert = () => {
    setShowAlert(false)
  }

  return (
    <RenderIf condition={showAlert}>
      <>
        <span> { message } </span>
        <RenderIf condition={location !== null}>
          <span> { location }</span>
        </RenderIf>
        <div className="close" data-id="renderer" onClick={handleCloseAlert}>
          <i className="fas fa-times"></i>
        </div>
        <div className="d-flex pt-1 flex-row-reverse">
          <span className="ml-3 pt-1 py-1" >
            <CopyToClipboard content={message} className="p-0 m-0 far fa-copy error" direction={'top'} />
          </span>
        </div>
      </>
    </RenderIf>
  )
}
