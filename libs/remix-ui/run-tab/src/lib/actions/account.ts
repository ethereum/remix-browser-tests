import { shortenAddress } from "@remix-ui/helper"
import { RunTab } from "../types/run-tab"
import { clearInstances, setAccount, setExecEnv } from "./actions"
import { displayNotification, fetchAccountsListFailed, fetchAccountsListRequest, fetchAccountsListSuccess, setMatchPassphrase, setPassphrase } from "./payload"
import { toChecksumAddress } from '@ethereumjs/util'

import "viem/window"
import { createPublicClient, http, custom, Account, PublicClient, Address } from "viem"
import { sepolia } from "viem/chains"
import { entryPoint07Address } from "viem/account-abstraction"
import "permissionless"
import { toSafeSmartAccount } from "permissionless/accounts"

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
      let accounts = await plugin.blockchain.getAccounts()
      if (!accounts) accounts = []

      const loadedAccounts = {}

      for (const account of accounts) {
        const balance = await plugin.blockchain.getBalanceInEther(account)
        loadedAccounts[account] = shortenAddress(account, balance)
      }
      const provider = plugin.blockchain.getProvider()

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
          dispatch(displayNotification('Error', 'Passphrase does not match', 'OK', null))
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
  console.log('createSmartAccount action')

  // @ts-ignore
  const accounts = await window.ethereum!.request({ method: 'eth_requestAccounts' })
  console.log('account---accounts->', accounts) 
  const selectedAddress = plugin.REACT_API.accounts.selectedAccount
  console.log('account---selectedAddress->', selectedAddress) 
  
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: custom(window.ethereum),
  })

  console.log('publicClient->', publicClient) 


  // const owner = privateKeyToAccount(SIGNER_PRIVATE_KEY)

  

  const safeAccount = await toSafeSmartAccount({
      client: publicClient,
      entryPoint: {
          address: entryPoint07Address,
          version: "0.7",
      },
      owners: [selectedAddress],
      // saltNonce: 0n, // optional
      version: "1.4.1"
  })

  console.log('safeAccount----->', safeAccount)
  console.log('safeAccount----->', safeAccount.address)
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

export const addFileInternal = async (plugin: RunTab, path: string, content: string) => {
  const file = await plugin.call('fileManager', 'writeFileNoRewrite', path, content)
  await plugin.call('fileManager', 'open', file.newPath)
}
