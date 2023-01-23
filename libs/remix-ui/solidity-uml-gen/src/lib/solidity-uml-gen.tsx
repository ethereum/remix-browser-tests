import React, { useEffect, useState } from 'react'
import Viewer from 'react-viewer'
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
      <button key={btn.buttonText} className="btn btn-primary btn-lg ml-4 mt-4" disabled={!btn.action}>{btn.buttonText}</button>
    ))}
  </>
)

export function RemixUiSolidityUmlGen ({ plugin, updatedSvg }: RemixUiSolidityUmlGenProps) {
  const [showViewer, setShowViewer] = useState(false)
  const [svgPayload, setSVGPayload] = useState<string>('')

  const validSvg = () => {
    return updatedSvg.startsWith('<?xml') && updatedSvg.includes('<svg')
  }
  useEffect(() => {
    if (validSvg()) {
      setSVGPayload(updatedSvg)
      console.log({ svgPayload })
    }
  })
  const buttons: ButtonAction[] = [
    { 
      buttonText: 'Download as PDF',
      svgValid: validSvg,
      action: () => console.log('generated!!')
    },
    { 
      buttonText: 'Download as PNG',
      svgValid: validSvg,
      action: () => console.log('generated!!')
    }
  ]
  return (
    <div className="d-flex flex-column">
      <div className="d-flex justify-center align-content-center">
        <ActionButtons buttons={buttons}/>
      </div>
      <div>
        <Viewer
          visible={showViewer}
          rotatable={false}
          loop={false}
          noClose={false}
          onClose={() => setShowViewer(false)}
          noFooter={true}
          showTotal={false}
          changeable={false}
          zoomSpeed={0.2}
          minScale={1}
          images={[{src: `data:image/svg+xml;base64,${btoa(updatedSvg ?? svgPayload)}`}]}
        />
      </div>
    </div>
  )
}

export default RemixUiSolidityUmlGen