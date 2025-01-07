import { useState, useEffect, useRef, useReducer } from 'react'

import ContractInteractionPluginClient from './ContractInteractionPluginClient'

import { AppContext } from './AppContext'
import { InteractionFormContext } from './InteractionFormContext'
import DisplayRoutes from './routes'
import type { ContractInteractionSettings, ThemeType, Chain } from './types'
import { mergeChainSettingsWithDefaults } from './utils'
import { IntlProvider } from 'react-intl'

import './App.css'
import { CompilerAbstract } from '@remix-project/remix-solidity'
import { useLocalStorage } from './hooks/useLocalStorage'
import { ContractDropdownSelection } from './components/ContractDropdown'
import { appReducer, appInitialState } from './reducers/state'
import { initDispatch } from './actions'

let plugin = ContractInteractionPluginClient;

const App = () => {
  const [appState, dispatch] = useReducer(appReducer, appInitialState);

  // TODO: theme
  // const [themeType, setThemeType] = useState<ThemeType>('dark')
  const [settings, setSettings] = useLocalStorage<ContractInteractionSettings>('contract-interaction:settings', { chains: {} })
  const [chains, setChains] = useState<Chain[]>([]) // State to hold the chains data
  const [compilationOutput, setCompilationOutput] = useState<{ [key: string]: CompilerAbstract } | undefined>()

  // Form values:
  const [selectedChain, setSelectedChain] = useState<Chain | undefined>()
  const [contractAddress, setContractAddress] = useState('')
  const [contractAddressError, setContractAddressError] = useState('')
  const [selectedContract, setSelectedContract] = useState<ContractDropdownSelection | undefined>()
  const [proxyAddress, setProxyAddress] = useState('')
  const [proxyAddressError, setProxyAddressError] = useState('')
  const [abiEncodedConstructorArgs, setAbiEncodedConstructorArgs] = useState<string>('')
  const [abiEncodingError, setAbiEncodingError] = useState<string>('')
  const [locale, setLocale] = useState<{ code: string; messages: any }>({
    code: 'en',
    messages: null,
  })

  useEffect(() => {
    plugin.internalEvents.on('interaction_activated', () => {
      // Fetch compiler artefacts initially
      plugin.call('compilerArtefacts' as any, 'getAllCompilerAbstracts').then((obj: any) => {
        setCompilationOutput(obj)
      })

      // Subscribe to compilations
      plugin.on('compilerArtefacts' as any, 'compilationSaved', (compilerAbstracts: { [key: string]: CompilerAbstract }) => {
        setCompilationOutput((prev) => ({ ...(prev || {}), ...compilerAbstracts }))
      })

      // Fetch chains.json and update state
      fetch('https://chainid.network/chains.json')
        .then((response) => response.json())
        .then((data) => setChains(data))
        .catch((error) => console.error('Failed to fetch chains.json:', error))
    })

    // Clean up on unmount
    return () => {
      plugin.off('compilerArtefacts' as any, 'compilationSaved')
    }
  }, [])

  useEffect(() => {
    initDispatch(dispatch);

    plugin.loadPlugin().then(() => {

      // @ts-ignore
      plugin.call('locale', 'currentLocale').then((locale: any) => {
        setLocale(locale)
      })
      // @ts-ignore
      plugin.on('locale', 'localeChanged', (locale: any) => {
        setLocale(locale)
      })
    });
  }, []);

  return (
    <AppContext.Provider value={{ plugin, appState, settings, setSettings, chains }}>

      <IntlProvider locale={locale.code} messages={locale.messages}>
        <InteractionFormContext.Provider value={{ selectedChain, setSelectedChain, contractAddress, setContractAddress, contractAddressError, setContractAddressError, selectedContract, setSelectedContract, proxyAddress, setProxyAddress, proxyAddressError, setProxyAddressError, abiEncodedConstructorArgs, setAbiEncodedConstructorArgs, abiEncodingError, setAbiEncodingError }}>
          <DisplayRoutes />
        </InteractionFormContext.Provider>
      </IntlProvider>

    </AppContext.Provider>
  )
}

export default App
