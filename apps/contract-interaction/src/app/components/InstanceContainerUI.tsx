import { CustomTooltip } from '@remix-ui/helper'
import { FormattedMessage } from 'react-intl'
import { UniversalDappUI } from './UniversalDappUI'
import * as remixLib from '@remix-project/remix-lib'
import { Chain } from '../types'
import { AppContext } from '../AppContext'
import { useContext } from 'react'
import { clearInstancesAction } from '../actions'

const txHelper = remixLib.execution.txHelper

const getFuncABIInputs = (funABI: any) => {
  if (!funABI.inputs) {
    return '';
  }
  return txHelper.inputParametersDeclarationToString(funABI.inputs);
};

export interface InstanceContainerUIProps {
  // TODO:
  //  runTransactions: (
  //   instanceIndex: number,
  //   lookupOnly: boolean,
  //   funcABI: FuncABI,
  //   inputsValues: string,
  //   contractName: string,
  //   contractABI, contract,
  //   address,
  //   logMsg:string,
  //   // mainnetPrompt: MainnetPrompt,
  //   gasEstimationPrompt: (msg: string) => JSX.Element,
  //   passphrasePrompt: (msg: string) => JSX.Element,
  //   funcIndex?: number) => void,
  // sendValue: string,
  // gasEstimationPrompt: (msg: string) => JSX.Element,
  // passphrasePrompt: (message: string) => JSX.Element,

  // mainnetPrompt: (tx: Tx, network: Network, amount: string, gasEstimation: string, gasFees: (maxFee: string, cb: (txFeeText: string, priceStatus: boolean) => void) => void, determineGasPrice: (cb: (txFeeText: string, gasPriceValue: string, gasPriceStatus: boolean) => void) => void) => JSX.Element,
  // getFuncABIInputs: (funcABI: FuncABI) => string

  // runTabState: RunTabState

  evmCheckComplete?: boolean
  chain: Chain,
  editInstance: (instance) => void,
  exEnvironment: string
  solcVersion: { version: string, canReceive: boolean }
}

export function InstanceContainerUI(props: InstanceContainerUIProps) {
  const { appState, plugin } = useContext(AppContext);
  const contractInstances = appState.contractInstances;

  const clearInstances = async () => {
    await clearInstancesAction()

    const pinnedContracts = appState.contractInstances.filter((instance, _) => instance.isPinned == true);

    if (pinnedContracts.length > 0) {
      await plugin.call('fileManager', 'remove', `.looked-up-contracts/pinned-contracts/${props.chain.chainId}`)
    }
  }

  return (
    <div className="udapp_instanceContainer mt-2 border-0 list-group-item">
      <div className="d-flex justify-content-between align-items-center p-2">
        <CustomTooltip placement="top-start" tooltipClasses="text-nowrap" tooltipId="userInterfacesForContractsTooltip" tooltipText={<FormattedMessage id="contractInteraction.userInterfacesForContracts" />}>
          <label className="udapp_deployedContracts text-nowrap" data-id="deployedContracts">
            <FormattedMessage id="contractInteraction.lookedupContracts" />
          </label>
        </CustomTooltip>
        <CustomTooltip placement="top-start" tooltipClasses="text-nowrap" tooltipId="numOfDeployedInstancesTooltip" tooltipText="Number of looked up contracts">
          <div className="badge badge-pill badge-primary text-center ml-2 mb-1" data-id="deployedContractsBadge">{contractInstances.length}</div>
        </CustomTooltip>
        <div className="w-100"></div>
        {contractInstances.length > 0 && (
          <CustomTooltip
            placement={'auto-end'}
            tooltipClasses="text-nowrap"
            tooltipId="clearContractInstancesTooltip"
            tooltipText={<FormattedMessage id="contractInteraction.clearContractInstances" />}
          >
            <i className="far fa-trash-alt udapp_icon mr-1 mb-2" data-id="clearContractInstances" onClick={clearInstances} aria-hidden="true"></i>
          </CustomTooltip>
        )}
      </div>

      {contractInstances.length > 0 && (
        <div>
          {' '}
          {contractInstances.map((instance, index) => {
            return (
              <UniversalDappUI
                key={index}
                instance={instance}
                // TODO
                // mainnetPrompt={props.mainnetPrompt}
                // runTransactions={props.runTransactions}
                // sendValue={props.sendValue}
                // gasEstimationPrompt={props.gasEstimationPrompt}
                // passphrasePrompt={props.passphrasePrompt}
                // context={getContext()}
                // getVersion={props.getVersion}
                // getCompilerDetails={props.getCompilerDetails}
                // runTabState={props.runTabState}
                index={index}
                chain={props.chain}
                getFuncABIInputs={getFuncABIInputs}
                exEnvironment={props.exEnvironment}
                editInstance={props.editInstance}
                solcVersion={props.solcVersion}
                evmCheckComplete={props.evmCheckComplete}
              />
            )
          })}
        </div>
      )}

    </div>
  )
}
