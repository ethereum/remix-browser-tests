import { AbiProviderIdentifier } from './AbiProviderTypes'

export interface AbiProviderSettings {
  apiUrl?: string
  explorerUrl?: string
  apiKey?: string
}

export type SettingsForAbiProviders = Partial<Record<AbiProviderIdentifier, AbiProviderSettings>>

export interface ChainSettings {
  abiProviders: SettingsForAbiProviders
}

export type SettingsForChains = Record<string, ChainSettings>

export interface ContractInteractionSettings {
  chains: SettingsForChains
}
