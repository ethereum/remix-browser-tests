import React from 'react'
import type { ThemeType, Chain, ContractInteractionSettings } from './types'
import { ContractInteractionPluginClient } from './ContractInteractionPluginClient'
import { appInitialState, State } from './reducers/state'

// Define the type for the context
type AppContextType = {
  // themeType: ThemeType
  // setThemeType: (themeType: ThemeType) => void
  plugin: ContractInteractionPluginClient
  appState: State,
  settings: ContractInteractionSettings
  setSettings: React.Dispatch<React.SetStateAction<ContractInteractionSettings>>
  chains: Chain[]
}

// Provide a default value with the appropriate types
const defaultContextValue: AppContextType = {
  // themeType: 'dark',
  // setThemeType: (themeType: ThemeType) => { },
  plugin: {} as ContractInteractionPluginClient,
  settings: { chains: {} },
  appState: appInitialState,
  setSettings: () => { },
  chains: [],
}

// Create the context with the type
export const AppContext = React.createContext<AppContextType>(defaultContextValue)
