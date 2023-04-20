import { envChangeNotification } from "@remix-ui/helper"
import { RunTab } from "../types/run-tab"
import { setExecutionContext, setFinalContext, updateAccountBalances, fillAccountsList } from "./account"
import { addExternalProvider, addInstance, addNewProxyDeployment, removeExternalProvider, setNetworkNameFromProvider } from "./actions"
import { addDeployOption, clearAllInstances, clearRecorderCount, fetchContractListSuccess, resetProxyDeployments, resetUdapp, setCurrentContract, setCurrentFile, setLoadType, setRecorderCount, setRemixDActivated, setSendValue, fetchAccountsListSuccess } from "./payload"
import { updateInstanceBalance } from './deploy'
import { CompilerAbstract } from '@remix-project/remix-solidity'
import BN from 'bn.js'
import Web3 from 'web3'
import { Plugin } from "@remixproject/engine"
import { getNetworkProxyAddresses } from "./deploy"
import { shortenAddress } from "@remix-ui/helper"

const _paq = window._paq = window._paq || []

export const setupEvents = (plugin: RunTab, dispatch: React.Dispatch<any>) => {
  plugin.blockchain.events.on('newTransaction', (tx, receipt) => {
    plugin.emit('newTransaction', tx, receipt)
  })

  plugin.blockchain.event.register('transactionExecuted', (error, from, to, data, lookupOnly, txResult) => {
    if (!lookupOnly) dispatch(setSendValue('0'))
    if (error) return
    updateAccountBalances(plugin, dispatch)
    updateInstanceBalance(plugin, dispatch)
  })

  plugin.blockchain.event.register('contextChanged', (context) => {
    dispatch(resetProxyDeployments())
    if (!context.startsWith('vm')) getNetworkProxyAddresses(plugin, dispatch)
    if (context !== 'walletconnect') plugin.call('manager', 'deactivatePlugin', 'walletconnect')
    setFinalContext(plugin, dispatch)
    fillAccountsList(plugin, dispatch)
    updateAccountBalances(plugin, dispatch)
  })

  plugin.blockchain.event.register('networkStatus', ({ error, network }) => {
    if (error) {
      const netUI = 'can\'t detect network'
      setNetworkNameFromProvider(dispatch, netUI)

      return
    }
    const networkProvider = plugin.networkModule.getNetworkProvider.bind(plugin.networkModule)
    const netUI = !networkProvider().startsWith('vm') ? `${network.name} (${network.id || '-'}) network` : 'VM'

    setNetworkNameFromProvider(dispatch, netUI)
  })

  plugin.blockchain.event.register('addProvider', provider => addExternalProvider(dispatch, provider))

  plugin.blockchain.event.register('removeProvider', name => removeExternalProvider(dispatch, name))

  plugin.blockchain.events.on('newProxyDeployment', (address, date, contractName) => addNewProxyDeployment(dispatch, address, date, contractName))

  plugin.on('solidity', 'compilationFinished', (file, source, languageVersion, data, input, version) => broadcastCompilationResult('remix', plugin, dispatch, file, source, languageVersion, data, input))

  plugin.on('vyper', 'compilationFinished', (file, source, languageVersion, data) => broadcastCompilationResult('vyper', plugin, dispatch, file, source, languageVersion, data))

  plugin.on('lexon', 'compilationFinished', (file, source, languageVersion, data) => broadcastCompilationResult('lexon', plugin, dispatch, file, source, languageVersion, data))

  plugin.on('yulp', 'compilationFinished', (file, source, languageVersion, data) => broadcastCompilationResult('yulp', plugin, dispatch, file, source, languageVersion, data))

  plugin.on('nahmii-compiler', 'compilationFinished', (file, source, languageVersion, data) => broadcastCompilationResult('nahmii', plugin, dispatch, file, source, languageVersion, data))

  plugin.on('hardhat', 'compilationFinished', (file, source, languageVersion, data) => broadcastCompilationResult('hardhat', plugin, dispatch, file, source, languageVersion, data))

  plugin.on('foundry', 'compilationFinished', (file, source, languageVersion, data) => broadcastCompilationResult('foundry', plugin, dispatch, file, source, languageVersion, data))

  plugin.on('truffle', 'compilationFinished', (file, source, languageVersion, data) => broadcastCompilationResult('truffle', plugin, dispatch, file, source, languageVersion, data))

  plugin.on('udapp', 'setEnvironmentModeReducer', (env: { context: string, fork: string }, from: string) => {
    plugin.call('notification', 'toast', envChangeNotification(env, from))
    setExecutionContext(plugin, dispatch, env)
  })

  plugin.on('udapp', 'clearAllInstancesReducer', () => {
    dispatch(clearAllInstances())
  })

  plugin.on('udapp', 'addInstanceReducer', (address, abi, name) => {
    addInstance(dispatch, { abi, address, name })
  })

  plugin.on('filePanel', 'setWorkspace', () => {
    dispatch(resetUdapp())
    resetAndInit(plugin)
    plugin.call('manager', 'isActive', 'remixd').then((activated) => {
      dispatch(setRemixDActivated(activated))
    })
  })

  plugin.on('manager', 'pluginActivated', (plugin: Plugin) => {
    if (plugin.name === 'remixd') {
      dispatch(setRemixDActivated(true))
    }
  })

  plugin.on('manager', 'pluginDeactivated', (plugin: Plugin) => {
    if (plugin.name === 'remixd') {
      dispatch(setRemixDActivated(false))
    }
  })

  plugin.fileManager.events.on('currentFileChanged', (currentFile: string) => {
    if (/.(.abi)$/.exec(currentFile)) {
      dispatch(setLoadType('abi'))
    } else if (/.(.sol)$/.exec(currentFile) ||
        /.(.vy)$/.exec(currentFile) || // vyper
        /.(.lex)$/.exec(currentFile) || // lexon
        /.(.contract)$/.exec(currentFile)) {
      dispatch(setLoadType('sol'))
    } else {
      dispatch(setLoadType('other'))
    }
    dispatch(setCurrentFile(currentFile))
  })

  plugin.recorder.event.register('recorderCountChange', (count) => {
    dispatch(setRecorderCount(count))
  })

  plugin.event.register('cleared', () => {
    dispatch(clearRecorderCount())
  })

  plugin.on('injected', 'accountsChanged', (accounts: Array<string>) => {
    const accountsMap = {}
    accounts.map(account => { accountsMap[account] = shortenAddress(account, '0')})
    dispatch(fetchAccountsListSuccess(accountsMap))
  })

  plugin.on('injected-trustwallet', 'accountsChanged', (accounts: Array<string>) => {
    const accountsMap = {}
    accounts.map(account => { accountsMap[account] = shortenAddress(account, '0')})
    dispatch(fetchAccountsListSuccess(accountsMap))
  })

  plugin.on('walletconnect', 'accountsChanged', async (accounts: Array<string>) => {
    const accountsMap = {}

    await Promise.all(accounts.map(async (account) => {
      const balance = await plugin.blockchain.getBalanceInEther(account)
      const updated = shortenAddress(account, balance)

      accountsMap[account] = updated
    }))
    dispatch(fetchAccountsListSuccess(accountsMap))
  })

  setInterval(() => {
    fillAccountsList(plugin, dispatch)
    updateInstanceBalance(plugin, dispatch)
  }, 30000)  
}

const broadcastCompilationResult = async (compilerName: string, plugin: RunTab, dispatch: React.Dispatch<any>, file, source, languageVersion, data, input?) => {
  _paq.push(['trackEvent', 'udapp', 'broadcastCompilationResult', compilerName])
  // TODO check whether the tab is configured
  const compiler = new CompilerAbstract(languageVersion, data, source, input)
  plugin.compilersArtefacts[languageVersion] = compiler
  plugin.compilersArtefacts.__last = compiler

  const contracts = getCompiledContracts(compiler).map((contract) => {
    return { name: languageVersion, alias: contract.name, file: contract.file, compiler, compilerName }
  })
  if ((contracts.length > 0)) {
    const contractsInCompiledFile = contracts.filter(obj => obj.file === file)
    let currentContract
    if (contractsInCompiledFile.length) currentContract = contractsInCompiledFile[0].alias
    else currentContract = contracts[0].alias
    dispatch(setCurrentContract(currentContract))
  }
  const isUpgradeable = await plugin.call('openzeppelin-proxy', 'isConcerned', data.sources && data.sources[file] ? data.sources[file].ast : {})

  if (isUpgradeable) {
    const options = await plugin.call('openzeppelin-proxy', 'getProxyOptions', data, file)
  
    dispatch(addDeployOption({ [file]: options }))
  } else {
    dispatch(addDeployOption({ [file]: {} }))
  }
  dispatch(fetchContractListSuccess({ [file]: contracts }))
  dispatch(setCurrentFile(file))
  // TODO: set current contract
}

const getCompiledContracts = (compiler) => {
  const contracts = []

  compiler.visitContracts((contract) => {
    contracts.push(contract)
  }) 
  return contracts
}

export const resetAndInit = (plugin: RunTab) => {
  plugin.blockchain.resetAndInit(plugin.config, {
    getAddress: (cb) => {
      cb(null, plugin.REACT_API.accounts.selectedAccount)
    },
    getValue: (cb) => {
      try {
        const number = plugin.REACT_API.sendValue
        const unit = plugin.REACT_API.sendUnit

        cb(null, Web3.utils.toWei(number, unit))
      } catch (e) {
        cb(e)
      }
    },
    getGasLimit: (cb) => {
      try {
        const gasLimit = '0x' + new BN(plugin.REACT_API.gasLimit, 10).toString(16)

        cb(null, gasLimit)
      } catch (e) {
        cb(e.message)
      }
    }
  })
}
