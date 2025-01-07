import { useEffect, useState } from 'react'
import { Chain, ChainSettings } from '../types'

export function useSourcifySupported(selectedChain: Chain, chainSettings: ChainSettings): boolean {
  const [sourcifySupported, setSourcifySupported] = useState(false)

  useEffect(() => {
    // Unsupported until fetch returns
    setSourcifySupported(false)

    const sourcifyApi = chainSettings?.abiProviders['Sourcify']?.apiUrl
    if (!sourcifyApi) {
      return
    }

    const queriedChainId = selectedChain.chainId
    const chainsUrl = new URL(sourcifyApi + '/chains')

    fetch(chainsUrl.href, { method: 'GET' })
      .then((response) => response.json())
      .then((result: Array<{ chainId: number }>) => {
        // Makes sure that the selectedChain didn't change while the request is running
        if (selectedChain.chainId === queriedChainId && result.find((chain) => chain.chainId === queriedChainId)) {
          setSourcifySupported(true)
        }
      })
      .catch((error) => {
        console.error('Failed to fetch chains.json:', error)
      })
  }, [selectedChain, chainSettings])

  return sourcifySupported
}
