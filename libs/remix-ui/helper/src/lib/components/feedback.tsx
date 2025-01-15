import { useState } from 'react'
import { CompilerFeedbackProps, CompilerReport } from '../types'
import { RenderIf } from '@remix-ui/helper'
import { CopyToClipboard } from '@remix-ui/clipboard'
import { FeedbackAlert } from './feedbackAlert'

export function CompilerFeedback ({ feedback, filePathToId, hideWarnings, openErrorLocation, askGPT }: CompilerFeedbackProps) {
  const [showException, setShowException] = useState<boolean>(true)

  const handleCloseException = () => {
    setShowException(false)
  }

  const handleOpenError = (report: CompilerReport) => {
    if (report.labels.length > 0) {
      openErrorLocation(filePathToId[report.labels[0].file_id], report.labels[0].range.start)
    }
  }

  const handleAskGPT = (report: CompilerReport) => {
    askGPT(report)
  }

  return (
    <div>
      {
        (feedback && typeof feedback === 'string') || (Array.isArray(feedback) && feedback.length > 0) ? (
          <div className="circuit_errors_box">
            <RenderIf condition={ (typeof feedback === "string") && showException }>
              <div className="circuit_feedback error alert alert-danger" data-id="circuit_feedback">
                <span> <>{ feedback }</> </span>
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
                        <div className={`circuit_feedback ${response.type.toLowerCase()} alert alert-danger`} data-id="circuit_feedback">
                          <FeedbackAlert
                            message={response.message + (response.labels[0] ? ": " + response.labels[0].message + ` ${filePathToId[response.labels[0].file_id]}:${response.labels[0].range.start}:${response.labels[0].range.end}` : '')}
                            askGPT={ () => handleAskGPT(response) } />
                        </div>
                      </RenderIf>
                      <RenderIf condition={(response.type === 'Warning') && !hideWarnings}>
                        <div className={`circuit_feedback ${response.type.toLowerCase()} alert alert-warning`} data-id="circuit_feedback">
                          <FeedbackAlert
                            message={response.message}
                            askGPT={() => { handleAskGPT(response) }} />
                        </div>
                      </RenderIf>
                    </div>
                  )
                  )
                }
              </>
            </RenderIf>
          </div>
        ) : <></>
      }
    </div>
  )
}
