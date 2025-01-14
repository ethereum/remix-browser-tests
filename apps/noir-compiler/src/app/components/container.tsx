import { useContext } from 'react'
import { CompileBtn, CustomTooltip, RenderIf } from '@remix-ui/helper'
import { FormattedMessage } from 'react-intl'
import { NoirAppContext } from '../contexts'
import { CompileOptions } from '@remix-ui/helper'
import { compileNoirCircuit } from '../actions'

export function Container () {
  const noirApp = useContext(NoirAppContext)

  const showCompilerLicense = async (message = 'License not available') => {
    try {
      const response = await fetch('https://raw.githubusercontent.com/noir-lang/noir/master/LICENSE-APACHE')
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const content = await response.text()
      // @ts-ignore
      noirApp.plugin.call('notification', 'modal', { id: 'modal_noir_compiler_license', title: 'Compiler License', message: content })
    } catch (e) {
      // @ts-ignore
      noirApp.plugin.call('notification', 'modal', { id: 'modal_noir_compiler_license', title: 'Compiler License', message })
    }
  }

  //   const handleOpenErrorLocation = async (location: string, startRange: string) => {
  //     if (location) {
  //       const fullPathLocation = await circuitApp.plugin.resolveReportPath(location)

  //       await circuitApp.plugin.call('fileManager', 'open', fullPathLocation)
  //       // @ts-ignore
  //       const startPosition: { lineNumber: number; column: number } = await circuitApp.plugin.call('editor', 'getPositionAt', startRange)
  //       // @ts-ignore
  //       await circuitApp.plugin.call('editor', 'gotoLine', startPosition.lineNumber - 1, startPosition.column)
  //     }
  //   }

  //   const handlePrimeChange = (value: PrimeValue) => {
  //     circuitApp.plugin.compilerPrime = value
  //     circuitApp.dispatch({ type: 'SET_PRIME_VALUE', payload: value as PrimeValue })
  //   }

  const handleCircuitAutoCompile = (value: boolean) => {
    noirApp.dispatch({ type: 'SET_AUTO_COMPILE', payload: value })
  }

  const handleCircuitHideWarnings = (value: boolean) => {
    noirApp.dispatch({ type: 'SET_HIDE_WARNINGS', payload: value })
  }

  //   const askGPT = async (report: CompilerReport) => {
  //     if (report.labels.length > 0) {
  //       const location = circuitApp.appState.filePathToId[report.labels[0].file_id]
  //       const error = report.labels[0].message

  //       if (location) {
  //         const fullPathLocation = await circuitApp.plugin.resolveReportPath(location)
  //         const content = await circuitApp.plugin.call('fileManager', 'readFile', fullPathLocation)
  //         const message = `
  //           circom code: ${content}
  //           error message: ${error}
  //           full circom error: ${JSON.stringify(report, null, 2)}
  //           explain why the error occurred and how to fix it.
  //           `
  //         await circuitApp.plugin.call('popupPanel' as any, 'showPopupPanel', true)
  //         setTimeout(async () => {
  //           await circuitApp.plugin.call('remixAI' as any, 'chatPipe', 'error_explaining', message)
  //         }, 500)
  //       } else {
  //         const message = `
  //           error message: ${error}
  //           full circom error: ${JSON.stringify(report, null, 2)}
  //           explain why the error occurred and how to fix it.
  //           `
  //         await circuitApp.plugin.call('popupPanel' as any, 'showPopupPanel', true)
  //         setTimeout(async () => {
  //           await circuitApp.plugin.call('remixAI' as any, 'chatPipe', 'error_explaining', message)
  //         }, 500)
  //       }
  //     } else {
  //       const error = report.message
  //       const message = `
  //       error message: ${error}
  //       full circom error: ${JSON.stringify(report, null, 2)}
  //       explain why the error occurred and how to fix it.
  //       `
  //       await circuitApp.plugin.call('popupPanel' as any, 'showPopupPanel', true)
  //       setTimeout(async () => {
  //         await circuitApp.plugin.call('remixAI' as any, 'chatPipe', 'error_explaining', message)
  //       }, 500)
  //     }
  //   }

  const handleCompileClick = () => {
    compileNoirCircuit(noirApp.plugin, noirApp.appState)
  }

  return (
    <section>
      <article>
        <div className="pt-0 noir_section">
          <div className="mb-1">
            <label className="noir_label form-check-label">
              <FormattedMessage id="noir.compiler" />
            </label>
            <CustomTooltip
              placement="bottom"
              tooltipId="showNoirCompilerTooltip"
              tooltipClasses="text-nowrap"
              tooltipText='See compiler license'
            >
              <span className="far fa-file-certificate border-0 p-0 ml-2" onClick={() => showCompilerLicense()}></span>
            </CustomTooltip>
            <CompileOptions setCircuitAutoCompile={handleCircuitAutoCompile} setCircuitHideWarnings={handleCircuitHideWarnings} autoCompile={noirApp.appState.autoCompile} hideWarnings={noirApp.appState.hideWarnings} />
            <div className="pb-2">
              <CompileBtn id="noir" plugin={noirApp.plugin} appState={noirApp.appState} compileAction={handleCompileClick} />
            </div>
            {/* <RenderIf condition={circuitApp.appState.status !== 'compiling'}>
              <CompilerFeedback feedback={circuitApp.appState.compilerFeedback} filePathToId={circuitApp.appState.filePathToId} openErrorLocation={handleOpenErrorLocation} hideWarnings={circuitApp.appState.hideWarnings} askGPT={askGPT} />
            </RenderIf> */}
          </div>
        </div>
      </article>
    </section>
  )
}