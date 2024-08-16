/* global ethereum */

import { shortenAddress } from "@remix-ui/helper"
import { RunTab } from "../types/run-tab"
import { clearInstances, setAccount, setExecEnv } from "./actions"
import { displayNotification, fetchAccountsListFailed, fetchAccountsListRequest, fetchAccountsListSuccess, setMatchPassphrase, setPassphrase } from "./payload"
import { toChecksumAddress } from '@ethereumjs/util'
import { createPublicClient, createWalletClient, http, custom, PublicClient } from "viem"
import { sepolia } from 'viem/chains'
import { V06 } from "userop"

declare global {
  interface Window {
    ethereum?: any
  }
}

export const updateAccountBalances = async (plugin: RunTab, dispatch: React.Dispatch<any>) => {
  const accounts = plugin.REACT_API.accounts.loadedAccounts

  for (const account of Object.keys(accounts)) {
    const balance = await plugin.blockchain.getBalanceInEther(account)
    const updated = shortenAddress(account, balance)
    accounts[account] = updated
  }
  dispatch(fetchAccountsListSuccess(accounts))
}

export const fillAccountsList = async (plugin: RunTab, dispatch: React.Dispatch<any>) => {
  try {
    dispatch(fetchAccountsListRequest())
    try {
      const provider = plugin.blockchain.getProvider()
      let accounts = await plugin.blockchain.getAccounts()
      if (provider && provider.startsWith('injected') && accounts?.length) {
        await loadSmartAccounts(plugin, accounts[0])
        if (plugin.REACT_API.smartAccounts.addresses.length) accounts.push(...plugin.REACT_API.smartAccounts.addresses)
      }
      if (!accounts) accounts = []

      const loadedAccounts = {}

      for (const account of accounts) {
        const balance = await plugin.blockchain.getBalanceInEther(account)
        loadedAccounts[account] = shortenAddress(account, balance)
      }

      if (provider && provider.startsWith('injected')) {
        const selectedAddress = plugin.blockchain.getInjectedWeb3Address()
        if (!(Object.keys(loadedAccounts).includes(toChecksumAddress(selectedAddress)))) setAccount(dispatch, null)
      }
      dispatch(fetchAccountsListSuccess(loadedAccounts))
    } catch (e) {
      dispatch(fetchAccountsListFailed(e.message))
    }
  } catch (e) {
    plugin.call('notification', 'toast', `Cannot get account list: ${e}`)
  }
}

export const setFinalContext = (plugin: RunTab, dispatch: React.Dispatch<any>) => {
  dispatch(fetchAccountsListRequest())
  // set the final context. Cause it is possible that this is not the one we've originally selected
  const value = _getProviderDropdownValue(plugin)

  setExecEnv(dispatch, value)
  clearInstances(dispatch)
}

const _getProviderDropdownValue = (plugin: RunTab): string => {
  return plugin.blockchain.getProvider()
}

export const setExecutionContext = (plugin: RunTab, dispatch: React.Dispatch<any>, executionContext: { context: string, fork: string }) => {
  plugin.blockchain.changeExecutionContext(executionContext, null, (alertMsg) => {
    plugin.call('notification', 'toast', alertMsg)
  }, () => { setFinalContext(plugin, dispatch) })
}

export const createNewBlockchainAccount = async (plugin: RunTab, dispatch: React.Dispatch<any>, cbMessage: JSX.Element) => {
  plugin.blockchain.newAccount(
    '',
    (cb) => {
      dispatch(displayNotification('Enter Passphrase', cbMessage, 'OK', 'Cancel', async () => {
        if (plugin.REACT_API.passphrase === plugin.REACT_API.matchPassphrase) {
          cb(plugin.REACT_API.passphrase)
        } else {
          dispatch(displayNotification('Error', 'Passphase does not match', 'OK', null))
        }
        setPassphrase('')
        setMatchPassphrase('')
      }, () => {}))
    },
    async (error, address) => {
      if (error) {
        return plugin.call('notification', 'toast', 'Cannot create an account: ' + error)
      }
      plugin.call('notification', 'toast', `account ${address} created`)
      await fillAccountsList(plugin, dispatch)
    }
  )
}

export const createSmartAccount = async (plugin: RunTab, dispatch: React.Dispatch<any>) => {
  const bundlerEndpoint = "https://public.stackup.sh/api/v1/node/ethereum-sepolia"
  const localStorageKey = 'smartAccounts'

  const ethClient: any = createPublicClient({
    chain: sepolia,
    transport: http(bundlerEndpoint)
  })

  const walletClient: any = createWalletClient({
    chain: sepolia,
    transport: custom(window.ethereum)
  })

  const addresses = await walletClient.getAddresses()

  const smartAccount = new V06.Account.Instance({
    ...V06.Account.Common.SimpleAccount.base(ethClient, walletClient),
  })
  await smartAccount.setSalt(BigInt(plugin.REACT_API.smartAccounts.addresses.length))
  const sender = await smartAccount.getSender()
  plugin.REACT_API.smartAccounts.addresses.push(sender)

  // Save smart accounts w.r.t. primary address of WalletClient
  const smartAccountsStr = localStorage.getItem(localStorageKey)
  const smartAccountsObj = JSON.parse(smartAccountsStr)
  smartAccountsObj[plugin.REACT_API.chainId][addresses[0]].push(sender)
  localStorage.setItem(localStorageKey, JSON.stringify(smartAccountsObj))

  plugin.call('notification', 'toast', `smart account created with address ${sender}`)

  await fillAccountsList(plugin, dispatch)
}

export const loadSmartAccounts = async (plugin, primaryAddress) => {
  const { chainId } = plugin.REACT_API
  const localStorageKey = 'smartAccounts'

  const smartAccountsStr = localStorage.getItem(localStorageKey)
  if (smartAccountsStr) {
    const smartAccountsObj = JSON.parse(smartAccountsStr)
    if (smartAccountsObj[chainId]) {
      if (smartAccountsObj[chainId][primaryAddress]) {
        for (const obj of smartAccountsObj[chainId][primaryAddress]) {
          plugin.REACT_API.smartAccounts.addresses.push(obj)
        }
      } else {
        smartAccountsObj[chainId][primaryAddress] = []
        localStorage.setItem(localStorageKey, JSON.stringify(smartAccountsObj))
      }
    } else {
      smartAccountsObj[chainId] = {}
      smartAccountsObj[chainId][primaryAddress] = []
      localStorage.setItem(localStorageKey, JSON.stringify(smartAccountsObj))
    }
  } else {
    const objToStore = {}
    objToStore[chainId] = {}
    objToStore[chainId][primaryAddress] = []
    localStorage.setItem(localStorageKey, JSON.stringify(objToStore))
  }
}

export const signMessageWithAddress = (plugin: RunTab, dispatch: React.Dispatch<any>, account: string, message: string, modalContent: (hash: string, data: string) => JSX.Element, passphrase?: string) => {
  plugin.blockchain.signMessage(message, account, passphrase, (err, msgHash, signedData) => {
    if (err) {
      console.error(err)
      return plugin.call('notification', 'toast', typeof err === 'string' ? err : err.message)
    }
    dispatch(displayNotification('Signed Message', modalContent(msgHash, signedData), 'OK', null, () => {}, null))
  })
}
