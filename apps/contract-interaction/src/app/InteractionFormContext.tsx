import React from 'react'
import type { Chain } from './types'
import { ContractDropdownSelection } from './components/ContractDropdown'

// Define the type for the context
type InteractionFormContextType = {
  selectedChain: Chain | undefined
  setSelectedChain: React.Dispatch<React.SetStateAction<Chain>>
  contractAddress: string
  setContractAddress: React.Dispatch<React.SetStateAction<string>>
  contractAddressError: string
  setContractAddressError: React.Dispatch<React.SetStateAction<string>>
  selectedContract: ContractDropdownSelection | undefined
  setSelectedContract: React.Dispatch<React.SetStateAction<ContractDropdownSelection>>
  proxyAddress: string
  setProxyAddress: React.Dispatch<React.SetStateAction<string>>
  proxyAddressError: string
  setProxyAddressError: React.Dispatch<React.SetStateAction<string>>
  abiEncodedConstructorArgs: string
  setAbiEncodedConstructorArgs: React.Dispatch<React.SetStateAction<string>>
  abiEncodingError: string
  setAbiEncodingError: React.Dispatch<React.SetStateAction<string>>
}

// Provide a default value with the appropriate types
const defaultContextValue: InteractionFormContextType = {
  selectedChain: undefined,
  setSelectedChain: (selectedChain: Chain) => { },
  contractAddress: '',
  setContractAddress: (contractAddress: string) => { },
  contractAddressError: '',
  setContractAddressError: (contractAddressError: string) => { },
  selectedContract: undefined,
  setSelectedContract: (selectedContract: ContractDropdownSelection) => { },
  proxyAddress: '',
  setProxyAddress: (proxyAddress: string) => { },
  proxyAddressError: '',
  setProxyAddressError: (contractAddressError: string) => { },
  abiEncodedConstructorArgs: '',
  setAbiEncodedConstructorArgs: (contractAddproxyAddressress: string) => { },
  abiEncodingError: '',
  setAbiEncodingError: (contractAddressError: string) => { },
}

// Create the context with the type
export const InteractionFormContext = React.createContext<InteractionFormContextType>(defaultContextValue)
