import type { ChainSettings, ContractInteractionSettings, SettingsForAbiProviders, AbiProviderSettings } from '../types/SettingsTypes'
import { AbiProviderIdentifier, ABI_PROVIDERS } from '../types/AbiProviderTypes'
import DEFAULT_APIS from './default-apis.json'

export function mergeChainSettingsWithDefaults(chainId: string, userSettings: ContractInteractionSettings): ChainSettings {
  const abiProviders: SettingsForAbiProviders = {}

  for (const abiProviderIndex of ABI_PROVIDERS) {
    const userSetting: AbiProviderSettings = userSettings.chains[chainId]?.abiProviders[abiProviderIndex] ?? {}

    abiProviders[abiProviderIndex] = { ...userSetting }

    let defaultsForVerifier: AbiProviderSettings
    if (abiProviderIndex === 'Sourcify') {
      defaultsForVerifier = DEFAULT_APIS['Sourcify']
    } else {
      defaultsForVerifier = DEFAULT_APIS[abiProviderIndex][chainId] ?? {}
    }

    // Prefer user settings over defaults
    abiProviders[abiProviderIndex] = Object.assign({}, defaultsForVerifier, userSetting)
  }
  return { abiProviders }
}

export function validConfiguration(chainSettings: ChainSettings | undefined, abiProviderIndex: AbiProviderIdentifier) {
  return !!chainSettings && !!chainSettings.abiProviders[abiProviderIndex]?.apiUrl && (abiProviderIndex !== 'Etherscan' || !!chainSettings.abiProviders[abiProviderIndex]?.apiKey)
}
