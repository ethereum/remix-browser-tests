import React, { useContext, useEffect } from 'react' // eslint-disable-line
import { TerminalContext } from '../context'
import { RemixUiTerminalProps, SET_OPEN } from '../types/terminalTypes'
export const RemixUITerminalMenuButtons = (props: RemixUiTerminalProps) => {
  const { xtermState, dispatchXterm, terminalState, dispatch } = useContext(TerminalContext)

  function selectOutput(event: any): void {
    props.plugin.call('layout', 'minimize', props.plugin.profile.name, false)
    dispatchXterm({ type: 'SHOW_OUTPUT', payload: true })
    dispatch({ type: SET_OPEN, payload: true })
  }

  function showTerminal(event: any): void {
    props.plugin.call('layout', 'minimize', props.plugin.profile.name, false)
    dispatchXterm({ type: 'SHOW_OUTPUT', payload: false })
    dispatch({ type: SET_OPEN, payload: true })
  }

  return (
    <div className='d-flex flex-row align-items-center'>
      <button id="tabOutput" className={`btn btn-sm border-secondary mr-2 border ${!xtermState.showOutput ? 'd-none' : ' btn-secondary'}`} onClick={selectOutput}>
        Output
      </button>
      <button id="tabXTerm" className={`btn btn-sm border-secondary ${xtermState.terminalsEnabled ? 'btn-secondary' : 'd-none'}`} onClick={showTerminal}>
        <span className="far fa-terminal border-0 ml-1"></span>
      </button>
    </div>
  )
}