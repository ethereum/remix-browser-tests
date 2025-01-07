import { useContext, useEffect, useMemo, useState } from 'react'
import { SearchableChainDropdown, ContractAddressInput, RawBytecodeInput } from '../components'
import { mergeChainSettingsWithDefaults, validConfiguration } from '../utils'
import type { LookupResponse, AbiProviderIdentifier, Chain } from '../types'
import { ABI_PROVIDERS } from '../types'
import { AppContext } from '../AppContext'
import { CustomTooltip } from '@remix-ui/helper'
import { getAbiProvider } from '../abiProviders'
import { useNavigate } from 'react-router-dom'
import { InteractionFormContext } from '../InteractionFormContext'
import { useSourcifySupported } from '../hooks/useSourcifySupported'
import { InstanceContainerUI } from '../components/InstanceContainerUI'
import { clearInstancesAction, loadPinnedContractsAction, setInstanceAction } from '../actions'
import { FormattedMessage } from 'react-intl'

export const GetABIView = () => {
  const { appState, settings, plugin } = useContext(AppContext);
  const contractInstances = appState.contractInstances;

  const { selectedChain, setSelectedChain } = useContext(InteractionFormContext)
  const [contractAddress, setContractAddress] = useState('')
  const [contractAddressError, setContractAddressError] = useState('')
  const [rawBytecode, setRawBytecode] = useState('')
  const [rawBytecodeError, setRawBytecodeError] = useState('')
  const [loadingAbiProviders, setLoadingAbiProviders] = useState<Partial<Record<AbiProviderIdentifier, boolean>>>({})
  const [lookupResults, setLookupResult] = useState<Partial<Record<AbiProviderIdentifier, LookupResponse>>>({})
  const navigate = useNavigate()

  const chainSettings = useMemo(() => (selectedChain ? mergeChainSettingsWithDefaults(selectedChain.chainId.toString(), settings) : undefined), [selectedChain, settings])
  const [deriveFromContractAddress, setDeriveFromContractAddress] = useState<boolean>(true)

  const sourcifySupported = useSourcifySupported(selectedChain, chainSettings)

  const noAbiProviderEnabled = ABI_PROVIDERS.every((abiProviderIndex) => !validConfiguration(chainSettings, abiProviderIndex) || (abiProviderIndex === 'Sourcify' && !sourcifySupported))

  const canDecodeFromContractAddress = deriveFromContractAddress && !contractAddressError && contractAddress && selectedChain && !noAbiProviderEnabled
  const canDecodeFromByteCode = !deriveFromContractAddress && !rawBytecodeError && rawBytecode

  const decodeDisabled = (!canDecodeFromContractAddress && !canDecodeFromByteCode)
  const lookUpDisabled = !!contractAddressError || !contractAddress || !selectedChain || noAbiProviderEnabled || !deriveFromContractAddress

  // Reset results when chain or contract changes
  useEffect(() => {
    setLookupResult({})
    setLoadingAbiProviders({})
  }, [selectedChain, contractAddress])

  const handleSelectedChain = async (newSelectedChain: Chain) => {
    setSelectedChain(newSelectedChain)

    // Clear all contract interfaces for the old chain.
    await clearInstancesAction();

    // Load pinned contracts for the new chain.
    await loadPinnedContractsAction(plugin, newSelectedChain);
  }

  const handleLookup = async (e) => {
    if (Object.values(loadingAbiProviders).some((loading) => loading)) {
      console.error('Lookup or Decoding request already running')
      return
    }

    e.preventDefault()

    // Filter the providers to only those with valid configurations.
    const validProviders = ABI_PROVIDERS.filter(
      (abiProviderIndex) =>
        validConfiguration(chainSettings, abiProviderIndex) &&
        (abiProviderIndex !== 'Sourcify' || sourcifySupported)
    );

    if (validProviders.length === 0) {
      throw new Error("No valid providers are configured.");
    }

    // Set all providers state to loading.
    validProviders.map(abiProviderIndex => setLoadingAbiProviders((prev) => ({ ...prev, [abiProviderIndex]: true })))

    // Create an array of promises for fetching the ABI from the differnt providers.
    const fetchPromises = validProviders.map(async (abiProviderIndex) => {

      try {
        const abiProvider = getAbiProvider(
          abiProviderIndex,
          chainSettings.abiProviders[abiProviderIndex]
        );

        const contractABI = await abiProvider.lookupABI(contractAddress);
        setLoadingAbiProviders((prev) => ({ ...prev, [abiProviderIndex]: false }))

        if (contractABI) {
          console.log(`Fetched ABI from provider '${abiProviderIndex}'`);
          return { abiProviderIndex, contractABI };
        } else {
          //     .catch((err) =>
          //       setLookupResult((prev) => {
          //         console.error(err)
          //         return { ...prev, [abiProviderIndex]: { status: 'lookup failed' } }
          //       })
          //     )
          console.warn(`Provider '${abiProviderIndex}' returned no ABI.`);
          return undefined;
        }
      } catch (err) {
        //     .catch((err) =>
        //       setLookupResult((prev) => {
        //         console.error(err)
        //         return { ...prev, [abiProviderIndex]: { status: 'lookup failed' } }
        //       })
        //     )
        console.warn(`Error fetching ABI from provider '${abiProviderIndex}':`, err);
        return undefined;
      }
    });

    // Resolve all promises and filter out undefined results.
    const results = (await Promise.all(fetchPromises)).filter(Boolean);

    // Check if there is at least one successful result.
    if (results.length > 0) {
      // Use the first successfully fetched ABI.
      console.log(`Using fetched ABI from provider '${results[0].abiProviderIndex}'`);
      setInstanceAction({
        address: contractAddress,
        name: '',
        abi: results[0].contractABI,
        isPinned: false
      })
    } else {
      console.error("All providers failed to fetch ABI.");
      throw new Error("Failed to fetch ABI from all providers.");
    }
  }

  async function getBytecode(contractAddress): Promise<String | undefined> {
    // If the user has opted for manual input, return the inputted bytecode.
    if (!deriveFromContractAddress) {
      return rawBytecode;
    }

    // Filter the providers to only those with valid configurations.
    const validProviders = ABI_PROVIDERS.filter(
      (abiProviderIndex) =>
        validConfiguration(chainSettings, abiProviderIndex) &&
        (abiProviderIndex !== 'Sourcify' || sourcifySupported)
    );

    if (validProviders.length === 0) {
      throw new Error("No valid providers are configured.");
    }

    // Set all providers state to loading.
    validProviders.map(abiProviderIndex => setLoadingAbiProviders((prev) => ({ ...prev, [abiProviderIndex]: true })))

    // Create an array of promises for fetching bytecode from the differnt providers.
    const fetchPromises = validProviders.map(async (abiProviderIndex) => {

      try {
        const abiProvider = getAbiProvider(
          abiProviderIndex,
          chainSettings.abiProviders[abiProviderIndex]
        );

        const byteCode = await abiProvider.lookupBytecode(contractAddress);
        setLoadingAbiProviders((prev) => ({ ...prev, [abiProviderIndex]: false }))

        if (byteCode) {
          console.log(`Fetched bytecode from provider '${abiProviderIndex}'`);
          return { abiProviderIndex, byteCode };
        } else {
          //     .catch((err) =>
          //       setLookupResult((prev) => {
          //         console.error(err)
          //         return { ...prev, [abiProviderIndex]: { status: 'lookup failed' } }
          //       })
          //     )
          console.warn(`Provider '${abiProviderIndex}' returned no bytecode.`);
          return undefined;
        }
      } catch (err) {
        //     .catch((err) =>
        //       setLookupResult((prev) => {
        //         console.error(err)
        //         return { ...prev, [abiProviderIndex]: { status: 'lookup failed' } }
        //       })
        //     )
        console.warn(`Error fetching bytecode from provider '${abiProviderIndex}':`, err);
        return undefined;
      }
    });

    // Resolve all promises and filter out undefined results.
    const results = (await Promise.all(fetchPromises)).filter(Boolean);

    // Check if there is at least one successful result.
    if (results.length > 0) {
      // Return the first successfully fetched bytecode.
      console.log(`Using fetched byteCode from provider '${results[0].abiProviderIndex}'`);
      return results[0].byteCode;
    } else {
      console.error("All providers failed to fetch bytecode.");
      throw new Error("Failed to fetch bytecode from all providers.");
    }
  }

  const handleDecode = async (e) => {

    if (Object.values(loadingAbiProviders).some((loading) => loading)) {
      console.error('Lookup or Decoding request already running')
      return
    }

    e.preventDefault()

    let bytecodeToDecode = await getBytecode(contractAddress);

    if (bytecodeToDecode) {
      console.error(`TODO: decode the bytecode: ${bytecodeToDecode}`)
    } else {
      // No contract address because no bytecode at address or failed to load data from API provider 
    }
  }

  return (
    <>
      <form>
        <SearchableChainDropdown label="Chain" id="network-dropdown" selectedChain={selectedChain} setSelectedChain={handleSelectedChain} />

        <div className="d-flex pb-1 remixui_compilerConfig custom-control custom-radio">
          <input
            className="custom-control-input"
            type="radio"
            name="configradio"
            value="manual"
            onChange={() => setDeriveFromContractAddress(true)}
            checked={deriveFromContractAddress}
            id="scManualConfig"
          />
          <label className="form-check-label custom-control-label" htmlFor="scManualConfig" data-id="scManualConfiguration">
            <FormattedMessage id="contractInteraction.contractAddress" defaultMessage="Contract Address" />
          </label>
        </div>


        <div className={`flex-column 'd-flex'}`}>
          <div className="mb-2 ml-4">
            <CustomTooltip
              placement="right"
              tooltipId="compilerLabelTooltip"
              tooltipClasses="text-nowrap"
              tooltipText={
                <span>
                  <FormattedMessage id="solidity.tooltipText6" />
                </span>
              }
            >
              <ContractAddressInput contractAddress={contractAddress} setContractAddress={setContractAddress} contractAddressError={contractAddressError} setContractAddressError={setContractAddressError} />
            </CustomTooltip>
          </div>
        </div>
        <div className="d-flex pb-1 remixui_compilerConfig custom-control custom-radio">
          <input
            className="custom-control-input"
            type="radio"
            name="configradio"
            value="manual"
            onChange={() => setDeriveFromContractAddress(false)}
            checked={!deriveFromContractAddress}
            id="scManualConfig2"
          />
          <label className="form-check-label custom-control-label" htmlFor="scManualConfig2" data-id="scManualConfiguration2">
            <FormattedMessage id="contractInteraction.deployedByteCode" defaultMessage="Deployed Bytecode" />
          </label>
        </div>
        <div className={`flex-column 'd-flex'}`}>
          <div className="mb-2 ml-4">
            <CustomTooltip
              placement="right"
              tooltipId="compilerLabelTooltip"
              tooltipClasses="text-nowrap"
              tooltipText={
                <span>
                  <FormattedMessage id="solidity.tooltipText6" />
                </span>
              }
            >
              <RawBytecodeInput rawBytecode={rawBytecode} setRawBytecode={setRawBytecode} rawBytecodeError={rawBytecodeError} setRawBytecodeError={setRawBytecodeError} />
            </CustomTooltip>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center">
          <CustomTooltip
            placement="bottom"
            tooltipId="compilerLabelTooltip"
            tooltipClasses="text-nowrap"
            tooltipText={
              <span>
                <FormattedMessage id="contractInteraction.lookupABI" />
              </span>
            }
          >
            <button
              type="button"
              className="btn btn-primary"
              disabled={lookUpDisabled}
              onClick={handleLookup}
            >
              Lookup ABI
            </button>
          </CustomTooltip>
          <CustomTooltip
            placement="bottom"
            tooltipId="compilerLabelTooltip"
            tooltipClasses="text-nowrap"
            tooltipText={
              <span>
                <FormattedMessage id="contractInteraction.decodeABI" />
              </span>
            }
          >
            <button
              type="button"
              className="btn btn-primary ml-auto"
              disabled={decodeDisabled}
              onClick={handleDecode}
            >
              Decode ABI
            </button>
          </CustomTooltip>
        </div>
      </form>
      <div className="pt-3">
        {chainSettings &&
          ABI_PROVIDERS.map((abiProviderIndex) => {
            if (!validConfiguration(chainSettings, abiProviderIndex)) {
              return (
                <div key={abiProviderIndex} className="pt-4">
                  <div>
                    <span className="font-weight-bold text-secondary">{abiProviderIndex}</span>{' '}
                    <CustomTooltip tooltipText="Configure the API in the settings">
                      <span className="text-secondary" style={{ textDecoration: 'underline dotted', cursor: 'pointer' }} onClick={() => navigate('/settings')}>
                        Enable?
                      </span>
                    </CustomTooltip>
                  </div>
                </div>
              )
            }

            if (abiProviderIndex === 'Sourcify' && !sourcifySupported) {
              return (
                <div key={abiProviderIndex} className="pt-4">
                  <div>
                    <span className="font-weight-bold text-secondary">{abiProviderIndex}</span>{' '}
                    <CustomTooltip tooltipText={`The configured Sourcify server (${chainSettings.abiProviders['Sourcify'].apiUrl}) does not support chain ${selectedChain?.chainId}`}>
                      <span className="text-secondary w-auto" style={{ textDecoration: 'underline dotted', cursor: 'pointer' }} onClick={() => navigate('/settings')}>
                        Unsupported
                      </span>
                    </CustomTooltip>
                  </div>
                </div>
              )
            }

            return (
              <div key={abiProviderIndex} className="pt-4">
                <div>
                  <span className="font-weight-bold">{abiProviderIndex}</span> <span className="text-secondary">{chainSettings.abiProviders[abiProviderIndex].apiUrl}</span>
                </div>
                {!!loadingAbiProviders[abiProviderIndex] && (
                  <div className="pt-2 d-flex justify-content-center">
                    <i className="fas fa-spinner fa-spin fa-2x"></i>
                  </div>
                )}
                {/* {!loadingAbiProviders[abiProviderIndex] && !!lookupResults[abiProviderIndex] && (
                  <div>
                    <div className="pt-2">
                      Status:{' '}
                      <span className="font-weight-bold" style={{ textTransform: 'capitalize' }}>
                        {lookupResults[abiProviderIndex].status}
                      </span>{' '}
                      {!!lookupResults[abiProviderIndex].lookupUrl && <a href={lookupResults[abiProviderIndex].lookupUrl} target="_blank" className="fa fas fa-arrow-up-right-from-square"></a>}
                    </div>
                  </div>
                )} */}
              </div>
            )
          })}
      </div>

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
