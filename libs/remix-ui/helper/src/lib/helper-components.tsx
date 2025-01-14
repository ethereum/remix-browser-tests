import { LayoutCompatibilityReport } from '@openzeppelin/upgrades-core/dist/storage/report'
import React from 'react'
import { FormattedMessage } from 'react-intl'
import { CompileOptionsProps } from '../types/compilerTypes'
import { CustomTooltip } from './components/custom-tooltip'
import { extractNameFromKey } from './remix-ui-helper'

export const fileChangedToastMsg = (from: string, path: string) => (
  <div>
    <i className="fas fa-exclamation-triangle text-danger mr-1"></i>
    <span>
      {from} <span className="font-weight-bold text-warning">is modifying</span> {path}
    </span>
  </div>
)

export const compilerConfigChangedToastMsg = (from: string, value: string) => (
  <div>
    <b>{from}</b> is updating the <b>Solidity compiler configuration</b>.<pre className="text-left">{value}</pre>
  </div>
)

export const compileToastMsg = (from: string, fileName: string) => (
  <div>
    <b>{from}</b> is requiring to compile <b>{fileName}</b>
  </div>
)

export const compilingToastMsg = (settings: string) => (
  <div>
    <b>Recompiling and debugging with params</b>
    <pre className="text-left">{settings}</pre>
  </div>
)

export const compilationFinishedToastMsg = () => (
  <div>
    <b>Compilation failed...</b> continuing <i>without</i> source code debugging.
  </div>
)

export const notFoundToastMsg = (address: string) => (
  <div>
    <b>Contract {address} not found in source code repository</b> continuing <i>without</i> source code debugging.
  </div>
)

export const localCompilationToastMsg = () => (
  <div>
    <b>Using compilation result from Solidity module</b>
  </div>
)

export const sourceVerificationNotAvailableToastMsg = () => (
  <div>
    <b>Source verification plugin not activated or not available.</b> continuing <i>without</i> source code debugging.
  </div>
)

export const envChangeNotification = (env: {context: string; fork: string}, from: string) => (
  <div>
    <i className="fas fa-exclamation-triangle text-danger mr-1"></i>
    <span>
      {from + ' '}
      <span className="font-weight-bold text-warning">set your environment to</span> {env && env.context}
    </span>
  </div>
)

export const storageFullMessage = () => (
  <div>
    <i className="fas fa-exclamation-triangle text-danger mr-1"></i>
    <span className="font-weight-bold">
      <span>Cannot save this file due to full LocalStorage. Backup existing files and free up some space.</span>
    </span>
  </div>
)

export const recursivePasteToastMsg = () => <div>File(s) to paste is an ancestor of the destination folder</div>

export const logBuilder = (msg: string) => {
  return <pre>{msg}</pre>
}

export const cancelProxyMsg = () => (
  <div>
    <b>Proxy deployment cancelled.</b>
  </div>
)

export const cancelUpgradeMsg = () => (
  <div>
    <b>Upgrade with proxy cancelled.</b>
  </div>
)

export const deployWithProxyMsg = () => (
  <div>
    <b>Deploy with Proxy</b> will initiate two (2) transactions:
    <ol className="pl-3">
      <li key="impl-contract">Deploying the implementation contract</li>
      <li key="proxy-contract">Deploying an ERC1967 proxy contract</li>
    </ol>
  </div>
)

export const upgradeWithProxyMsg = () => (
  <div>
    <b>Upgrade with Proxy</b> will initiate two (2) transactions:
    <ol className="pl-3">
      <li key="new-impl-contract">Deploying the new implementation contract</li>
      <li key="update-proxy-contract">Updating the proxy contract with the address of the new implementation contract</li>
    </ol>
  </div>
)

export const unavailableProxyLayoutMsg = () => (
  <div>
    <p>
      The previous contract implementation is NOT available for an upgrade comparison
      <br /> A new storage layout will be saved for future upgrades.
    </p>
  </div>
)

export const upgradeReportMsg = (report: LayoutCompatibilityReport) => (
  <div>
    <div className="py-2 ml-2 mb-1 align-self-end mb-2 d-flex">
      <span className="align-self-center pl-4 mt-1">
        <i className="pr-2 text-warning far fa-exclamation-triangle" aria-hidden="true" style={{ fontSize: 'xxx-large', fontWeight: 'lighter' }}></i>
      </span>
      <div className="d-flex flex-column">
        <span className="pl-4 mt-1">The storage layout of new implementation is NOT</span>
        <span className="pl-4 mt-1">compatible with the previous implementation.</span>
        <span className="pl-4 mt-1">Your contract's storage may be partially or fully erased!</span>
      </div>
    </div>
    <div className="pl-4 text-danger">{report.explain()}</div>
  </div>
)

export function RenderIf({ condition, children }: { condition: boolean, children: JSX.Element }) {
  return condition ? children : null
}

export function RenderIfNot({ condition, children }: { condition: boolean, children: JSX.Element }) {
  return condition ? null : children
}

export const CompileOptions = ({ autoCompile, hideWarnings, setCircuitAutoCompile, setCircuitHideWarnings }: CompileOptionsProps) => (

  <div>
    <div className="mt-2 custom-control custom-checkbox">
      <input
        className="custom-control-input"
        type="checkbox"
        onChange={(e) => setCircuitAutoCompile(e.target.checked)}
        title="Auto compile"
        checked={autoCompile}
        id="autoCompileCircuit"
      />
      <label className="form-check-label custom-control-label" htmlFor="autoCompileCircuit" data-id="auto_compile_circuit_checkbox_input">
        <FormattedMessage id="circuit.autoCompile" />
      </label>
    </div>
    <div className="mt-1 mb-2 circuit_warnings_box custom-control custom-checkbox">
      <input
        className="custom-control-input"
        onChange={(e) => setCircuitHideWarnings(e.target.checked)}
        id="hideCircuitWarnings"
        type="checkbox"
        title="Hide warnings"
        checked={hideWarnings}
      />
      <label className="form-check-label custom-control-label" htmlFor="hideCircuitWarnings" data-id="hide_circuit_warnings_checkbox_input">
        <FormattedMessage id="solidity.hideWarnings" />
      </label>
    </div>
  </div>
)

export const CompileBtn = ({ plugin, appState, id, compileAction }: { plugin: any, appState: { status, filePath }, id: string, compileAction: () => void }) => (
  <CustomTooltip
    placement="auto"
    tooltipId="overlay-tooltip-compile"
    tooltipText={
      <div className="text-left">
        <div>
          <b>Ctrl+S</b> to compile {appState.filePath}
        </div>
      </div>
    }
  >
    <button
      className="btn btn-primary btn-block d-block w-100 text-break mb-1 mt-1"
      onClick={() => { compileAction() }}
      disabled={(appState.filePath === "") || (appState.status === "compiling")}
      data-id={`compile_${id}_btn`}
    >
      <div className="d-flex align-items-center justify-content-center">
        <RenderIf condition={appState.status === 'compiling'}>
          <i className="fas fa-sync fa-spin mr-2" aria-hidden="true"></i>
        </RenderIf>
        <div className="text-truncate overflow-hidden text-nowrap">
          <span>
            <FormattedMessage id="circuit.compile" />
          </span>
          <span className="ml-1 text-nowrap">
            <RenderIf condition={appState.filePath === ""}>
              <FormattedMessage id="circuit.noFileSelected" />
            </RenderIf>
            <RenderIfNot condition={appState.filePath === ""}>
              <>{extractNameFromKey(appState.filePath)}</>
            </RenderIfNot>
          </span>
        </div>
      </div>
    </button>
  </CustomTooltip>
)
