import { Actions } from "@remix-ui/xterm"
import { Plugin } from "@remixproject/engine"

export const createTerminal = async (shell: string = '', plugin: Plugin, workingDir: string, dispatch: React.Dispatch<Actions>) => {
  const shells: string[] = await plugin.call('xterm', 'getShells')
  dispatch({ type: 'ADD_SHELLS', payload: shells })
  const pid = await plugin.call('xterm', 'createTerminal', workingDir, shell)
  dispatch({ type: 'SHOW_OUTPUT', payload: false })
  dispatch({ type: 'HIDE_ALL_TERMINALS', payload: null })
  dispatch({ type: 'ADD_TERMINAL', payload: { pid, queue: '', timeStamp: Date.now(), ref: null, hidden: false } })

  /*
  setTerminals(prevState => {
    // set all to hidden
    prevState.forEach(xtermState => {
      xtermState.hidden = true
    })
    return [...prevState, {
      pid: pid,
      queue: '',
      timeStamp: Date.now(),
      ref: null,
      hidden: false
    }]
  })
  */
}