import type { AbiProviderIdentifier, VerifierSettings } from '../types'
import { AbstractAbiProvider } from './AbstractAbiProvider'
import { BlockscoutAbiProvider } from './BlockscoutAbiProvider'
import { EtherscanAbiProvider } from './EtherscanAbiProvider'
import { SourcifyAbiProvider } from './SourcifyAbiProvider'

export { AbstractAbiProvider } from './AbstractAbiProvider'
export { BlockscoutAbiProvider } from './BlockscoutAbiProvider'
export { SourcifyAbiProvider } from './SourcifyAbiProvider'
export { EtherscanAbiProvider } from './EtherscanAbiProvider'

export function getVerifier(identifier: AbiProviderIdentifier, settings: VerifierSettings): AbstractAbiProvider {
  switch (identifier) {
    case 'Sourcify':
      if (!settings?.explorerUrl) {
        throw new Error('The Sourcify verifier requires an explorer URL.')
      }
      return new SourcifyAbiProvider(settings.apiUrl, settings.explorerUrl)
    case 'Etherscan':
      if (!settings?.explorerUrl) {
        throw new Error('The Etherscan verifier requires an explorer URL.')
      }
      if (!settings?.apiKey) {
        throw new Error('The Etherscan verifier requires an API key.')
      }
      return new EtherscanAbiProvider(settings.apiUrl, settings.explorerUrl, settings.apiKey)
    case 'Blockscout':
      return new BlockscoutAbiProvider(settings.apiUrl)
  }
}
