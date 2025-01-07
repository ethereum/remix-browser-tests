import { useContext, useState } from 'react'
import { SearchableChainDropdown } from '../components'
import type { Chain } from '../types'
import { AppContext } from '../AppContext'
import { InteractionFormContext } from '../InteractionFormContext'
import { InstanceContainerUI } from '../components/InstanceContainerUI'
import { clearInstancesAction, loadPinnedContractsAction, setSelectedAccountAction, setSendValue, setSendUnit, setGasLimit } from '../actions'
import { Modal } from 'libs/remix-ui/run-tab/src/lib/types'
import { GasLimitUI } from 'libs/remix-ui/run-tab/src/lib/components/gasLimit'
import { ValueUI } from 'libs/remix-ui/run-tab/src/lib/components/value'
import { AccountUI } from 'libs/remix-ui/run-tab/src/lib/components/account'
import { NetworkUI } from 'libs/remix-ui/run-tab/src/lib/components/network'

export const InteractView = () => {
  const { appState, plugin } = useContext(AppContext);
  const contractInstances = appState.contractInstances;
  const environment = appState.interaction_environment;

  const { selectedChain, setSelectedChain } = useContext(InteractionFormContext)

  const handleSelectedChain = async (newSelectedChain: Chain) => {
    setSelectedChain(newSelectedChain)

    // Clear all contract interfaces for the old chain.
    await clearInstancesAction();

    // Load pinned contracts for the new chain.
    await loadPinnedContractsAction(plugin, newSelectedChain);
  }

  const [modals, setModals] = useState<Modal[]>([])
  const modal = (
    title: string,
    message: string | JSX.Element,
    okLabel: string,
    okFn: () => void,
    cancelLabel?: string,
    cancelFn?: () => void,
    okBtnClass?: string,
    cancelBtnClass?: string
  ) => {
    setModals((modals) => {
      modals.push({
        message,
        title,
        okLabel,
        okFn,
        cancelLabel,
        cancelFn,
        okBtnClass,
        cancelBtnClass
      })
      return [...modals]
    })
  }

  const [toasters, setToasters] = useState<string[]>([])

  const toast = (toasterMsg: string) => {
    setToasters((messages) => {
      messages.push(toasterMsg)
      return [...messages]
    })
  }

  return (
    <>
      {/* INTERACTION_ENVIRONMENT */}
      <SearchableChainDropdown label="Chain" id="network-dropdown" selectedChain={selectedChain} setSelectedChain={handleSelectedChain} />
      <NetworkUI networkName={selectedChain.name ? selectedChain.name : ''} />
      <AccountUI
        addFile={() => { console.error('not supported in this plugin') }}
        personalMode={false}
        selectExEnv={'blockchain'}
        accounts={environment.accounts}
        setAccount={setSelectedAccountAction}
        createNewBlockchainAccount={() => { console.error('not supported in this plugin') }}
        setPassphrase={() => { console.error('not supported in this plugin') }}
        setMatchPassphrase={() => { console.error('not supported in this plugin') }}
        tooltip={toast}
        modal={modal}
        signMessageWithAddress={() => { console.error('not supported in this plugin') }}
        passphrase={''}
      />
      <GasLimitUI gasLimit={environment.gasLimit} setGasFee={setGasLimit} />
      <ValueUI sendUnit={environment.sendUnit} setUnit={setSendUnit} sendValue={environment.sendValue} setSendValue={setSendValue} />

      {/* INSTANCES */}
      {contractInstances.length > 0 && (
        <InstanceContainerUI
          // TODO
          // clearInstances={() => { }}
          // unpinInstance={(index) => { }}
          // pinInstance={(index, pinnedAt) => { }}
          // removeInstance={(index) => { }}

          // "TODO: runTransactions + sendValue"
          // runTransactions={executeTransactions}
          // sendValue={runTab.sendValue}
          // gasEstimationPrompt={gasEstimationPrompt}
          // passphrasePrompt={passphrasePrompt}
          // mainnetPrompt={mainnetPrompt}

          // solcVersion={solcVersion}
          // getVersion={getVersion}
          // getFuncABIInputs={getFuncABIValues}
          // TODO
          solcVersion={{
            version: '',
            canReceive: false
          }}
          evmCheckComplete={true}
          exEnvironment={"TODO: environment"}
          chain={selectedChain}
          editInstance={(instance) => {
            // TODO
            // const {metadata, abi, object} = instance.contractData
            // plugin.call('quick-dapp', 'edit', {
            //   address: instance.address,
            //   abi: abi,
            //   name: instance.name,
            //   network: runTab.networkName,
            //   devdoc: object.devdoc,
            //   methodIdentifiers: object.evm.methodIdentifiers,
            //   solcVersion: JSON.parse(metadata).compiler.version,
            // })
          }}
        />
      )}
    </>
  )
}
