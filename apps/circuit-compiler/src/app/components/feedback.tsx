import { useState } from 'react'
import { CompilerFeedbackProps, CompilerReport } from '../types'
import { RenderIf } from '@remix-ui/helper'
import {CopyToClipboard} from '@remix-ui/clipboard'
import { FeedbackAlert } from './feedbackAlert'

export function CompilerFeedback ({ feedback, filePathToId, hideWarnings, openErrorLocation }: CompilerFeedbackProps) {
  const [ showException, setShowException ] = useState<boolean>(true)

  const handleCloseException = () => {
    setShowException(false)
  }

  const handleOpenError = (report: CompilerReport) => {
    if (report.labels.length > 0) {
      openErrorLocation(filePathToId[report.labels[0].file_id], report.labels[0].range.start)
    }
  }

  return (
    <div>
      <div className="circuit_errors_box py-4">
        <RenderIf condition={ (typeof feedback === "string") && showException }>
          <div className="circuit_feedback error alert alert-danger">
            <span> { feedback } </span>
            <div className="close" data-id="renderer" onClick={handleCloseException}>
              <i className="fas fa-times"></i>
            </div>
            <div className="d-flex pt-1 flex-row-reverse">
              <span className="ml-3 pt-1 py-1" >
                <CopyToClipboard content={feedback} className="p-0 m-0 far fa-copy error" direction={'top'} />
              </span>
            </div>
          </div>
        </RenderIf>
        <RenderIf condition={ Array.isArray(feedback) }>
          <>
            {
              Array.isArray(feedback) && feedback.map((response, index) => (
                <div key={index} onClick={() => handleOpenError(response)}>
                  <RenderIf condition={response.type === 'Error'}>
                    <div className={`circuit_feedback ${response.type.toLowerCase()} alert alert-danger`}>
                      <FeedbackAlert message={response.message} location={ response.labels[0] ? response.labels[0].message + ` ${filePathToId[response.labels[0].file_id]}:${response.labels[0].range.start}:${response.labels[0].range.end}` : null} />
                    </div>
                  </RenderIf>
                  <RenderIf condition={(response.type === 'Warning') && !hideWarnings}>
                    <div className={`circuit_feedback ${response.type.toLowerCase()} alert alert-warning`}>
                      <FeedbackAlert message={response.message} location={null} />
                    </div>
                  </RenderIf>
                </div>
              )
              )
            }
          </>
        </RenderIf>
      </div>
    </div>
  )
}
