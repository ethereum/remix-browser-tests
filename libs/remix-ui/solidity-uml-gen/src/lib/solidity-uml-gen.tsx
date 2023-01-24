import React, { useEffect, useState } from 'react'
import { ISolidityUmlGen } from '../types'
export interface RemixUiSolidityUmlGenProps {
  plugin?: ISolidityUmlGen
  updatedSvg?: string
}

type ButtonAction = {
  svgValid: () => boolean
  action: () => void
  buttonText: string
}

interface ActionButtonsProps {
  buttons: ButtonAction[]
}

const ActionButtons = ({ buttons }: ActionButtonsProps) => (
  <>
    {buttons.map(btn => (
      <button
        key={btn.buttonText}
        className="btn btn-primary btn-lg ml-4 mt-4"
        disabled={!btn.svgValid}
        onClick={btn.action}
      >
        {btn.buttonText}
      </button>
    ))}
  </>
)

export function RemixUiSolidityUmlGen ({ plugin, updatedSvg }: RemixUiSolidityUmlGenProps) {
  const [showViewer, setShowViewer] = useState(false)
  const [svgPayload, setSVGPayload] = useState<string>('')
  const [validSvg, setValidSvg] = useState(false)



  useEffect(() => {
    console.log('updatedSvg updated') 
    setValidSvg (updatedSvg.startsWith('<?xml') && updatedSvg.includes('<svg')) 
    setShowViewer(updatedSvg.startsWith('<?xml') && updatedSvg.includes('<svg'))
  }
  , [updatedSvg])

  const buttons: ButtonAction[] = [
    { 
      buttonText: 'Download as PDF',
      svgValid: () => validSvg,
      action: () => console.log('generated!!')
    },
    { 
      buttonText: 'Download as PNG',
      svgValid: () => validSvg,
      action: () => console.log('generated!!')
    }
  ]
  const Display = () => (
    <div className="d-flex flex-column">
      <div className="d-flex justify-center align-content-center">
        <ActionButtons buttons={buttons}/>
      </div>
      <div>
        <img 
          src={`data:image/svg+xml;base64,${btoa(plugin.updatedSvg ?? svgPayload)}`}
          width={800}
          height={600}
        />
      </div>
    </div>
  )
  return (<>
    { <Display /> }
    </>
  )
}

export default RemixUiSolidityUmlGen