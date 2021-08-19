import React, { useState } from 'react' // eslint-disable-line
import { SolidityCompilerProps } from './types'
import { CompilerContainer } from './compiler-container' // eslint-disable-line
import { ContractSelection } from './contract-selection' // eslint-disable-line
import { Toaster } from '@remix-ui/toaster' // eslint-disable-line
import { ModalDialog } from '@remix-ui/modal-dialog' // eslint-disable-line
import { Renderer } from '@remix-ui/renderer' // eslint-disable-line

import './css/style.css'

export const SolidityCompiler = (props: SolidityCompilerProps) => {
  const { plugin, plugin: { currentFile, compileTabLogic, contractsDetails, contractMap, compileErrors, configurationSettings } } = props
  const [state, setState] = useState({
    isHardhatProject: false,
    currentFile,
    contractsDetails: {},
    contractMap: {},
    loading: false,
    compileTabLogic: null,
    compiler: null,
    toasterMsg: '',
    modal: {
      hide: true,
      title: '',
      message: null,
      okLabel: '',
      okFn: () => {},
      cancelLabel: '',
      cancelFn: () => {},
      handleHide: null
    }
  })
  const [currentVersion, setCurrentVersion] = useState('')

  plugin.onCurrentFileChanged = (currentFile: string) => {
    setState(prevState => {
      return { ...prevState, currentFile }
    })
  }

  plugin.onResetResults = () => {
    setState(prevState => {
      return { ...prevState, currentFile: '', contractsDetails: {}, contractMap: {} }
    })
  }

  plugin.onSetWorkspace = async (workspace: any) => {
    const isHardhat = workspace.isLocalhost && await compileTabLogic.isHardhatProject()
    setState(prevState => {
      return { ...prevState, currentFile, isHardhatProject: isHardhat }
    })
  }

  plugin.onNoFileSelected = () => {
    setState(prevState => {
      return { ...prevState, currentFile: '' }
    })
  }

  plugin.onCompilationFinished = (contractsDetails: any, contractMap: any) => {
    setState(prevState => {
      return { ...prevState, contractsDetails, contractMap }
    })
  }

  const toast = (message: string) => {
    setState(prevState => {
      return { ...prevState, toasterMsg: message }
    })
  }

  const updateCurrentVersion = (value) => {
    setCurrentVersion(value)
    plugin.setSelectedVersion(value)
  }

  const modal = async (title: string, message: string | JSX.Element, okLabel: string, okFn: () => void, cancelLabel?: string, cancelFn?: () => void) => {
    await setState(prevState => {
      return {
        ...prevState,
        modal: {
          ...prevState.modal,
          hide: false,
          message,
          title,
          okLabel,
          okFn,
          cancelLabel,
          cancelFn
        }
      }
    })
  }

  const handleHideModal = () => {
    setState(prevState => {
      return { ...prevState, modal: { ...state.modal, hide: true, message: null } }
    })
  }

  const panicMessage = (message: string) => (
    <div>
      <i className="fas fa-exclamation-circle remixui_panicError" aria-hidden="true"></i>
      The compiler returned with the following internal error: <br /> <b>{message}.<br />
      The compiler might be in a non-sane state, please be careful and do not use further compilation data to deploy to mainnet.
      It is heavily recommended to use another browser not affected by this issue (Firefox is known to not be affected).</b><br />
      Please join <a href="https://gitter.im/ethereum/remix" target="blank" >remix gitter channel</a> for more information.
    </div>
  )

  return (
    <>
      <div id="compileTabView">
        <CompilerContainer api={plugin} isHardhatProject={state.isHardhatProject} compileTabLogic={compileTabLogic} tooltip={toast} modal={modal} compiledFileName={currentFile} updateCurrentVersion={updateCurrentVersion} configurationSettings={configurationSettings} />
        <ContractSelection api={plugin} contractMap={contractMap} contractsDetails={contractsDetails} modal={modal} />
        <div className="remixui_errorBlobs p-4" data-id="compiledErrors">
          <span data-id={`compilationFinishedWith_${currentVersion}`}></span>
          { compileErrors.error && <Renderer message={compileErrors.error.formattedMessage || compileErrors.error} plugin={plugin} opt={{ type: compileErrors.error.severity || 'error', errorType: compileErrors.error.type }} /> }
          { compileErrors.error && (compileErrors.error.mode === 'panic') && modal('Error', panicMessage(compileErrors.error.formattedMessage), 'Close', null) }
          { compileErrors.errors && compileErrors.errors.length && compileErrors.errors.map((err, index) => {
            if (plugin.getConfiguration('hideWarnings')) {
              if (err.severity !== 'warning') {
                return <Renderer key={index} message={err.formattedMessage} plugin={plugin} opt={{ type: err.severity, errorType: err.type }} />
              }
            } else {
              return <Renderer key={index} message={err.formattedMessage} plugin={plugin} opt={{ type: err.severity, errorType: err.type }} />
            }
          }) }
        </div>
      </div>
      <Toaster message={state.toasterMsg} />
      <ModalDialog
        id='workspacesModalDialog'
        title={ state.modal.title }
        message={ state.modal.message }
        hide={ state.modal.hide }
        okLabel={ state.modal.okLabel }
        okFn={ state.modal.okFn }
        cancelLabel={ state.modal.cancelLabel }
        cancelFn={ state.modal.cancelFn }
        handleHide={ handleHideModal }>
        { (typeof state.modal.message !== 'string') && state.modal.message }
      </ModalDialog>
    </>
  )
}

export default SolidityCompiler
