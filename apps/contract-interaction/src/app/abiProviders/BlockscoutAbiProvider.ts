import { ABICategoryBlockScout } from '../types'
import { AbstractAbiProvider } from './AbstractAbiProvider';
import { EtherscanAbiProvider } from './EtherscanAbiProvider'

interface BlockscoutSmartContract {
  deployed_bytecode: string
}

export class BlockscoutAbiProvider extends EtherscanAbiProvider {
  LOOKUP_STORE_DIR = 'blockscout-interacted'

  constructor(apiUrl: string) {
    // apiUrl and explorerUrl are the same for Blockscout
    super(apiUrl, apiUrl, undefined)
  }

  /**
   * Get the blockexplorer specific URL for fetching the smart contract ABI.
   * 
   * @param contractAddress - The contract address.
   * @param ABICategory - The sub type of the ABI (one of the values: 'read' | 'write' | 'readProxy' | 'writeProxy').
   * @returns The url to fetch the ABI data.
   */
  getAbiURL(contractAddress: string, ABICategory: ABICategoryBlockScout): string {
    const url = new URL(this.explorerUrl + `/api/v2/smart-contracts/${contractAddress}/${ABICategory}`)
    return url.href
  }

  /**
   * Get the blockexplorer specific URL for fetching the raw bytecode of a smart contract.
   *
   * @param contractAddress - The contract address.
   * @returns The url to fetch the raw bytecode data.
   */
  getBytecodeURL(contractAddress: string): string {
    const url = new URL(this.explorerUrl + `/api/v2/smart-contracts/${contractAddress}`)
    return url.href
  }

  async lookupBytecode(contractAddress: string): Promise<String> {

    // TODO try-catch
    let response = await AbstractAbiProvider.fetch<BlockscoutSmartContract>(this.getBytecodeURL(contractAddress))
    return response.deployed_bytecode
  }

  // getContractCodeUrl(address: string): string {i
  //   const url = new URL(this.explorerUrl + `/address/${address}`)
  //   url.searchParams.append('tab', 'contract')
  //   return url.href
  // }

  // processReceivedFiles(source: unknown, contractAddress: string, chainId: string): { sourceFiles: SourceFile[]; targetFilePath?: string } {
  //   const blockscoutSource = source as BlockscoutSource

  //   const result: SourceFile[] = []
  //   const filePrefix = `/${this.LOOKUP_STORE_DIR}/${chainId}/${contractAddress}`

  //   const targetFilePath = `${filePrefix}/${blockscoutSource.FileName}`
  //   result.push({ content: blockscoutSource.SourceCode, path: targetFilePath })

  //   for (const additional of blockscoutSource.AdditionalSources ?? []) {
  //     result.push({ content: additional.SourceCode, path: `${filePrefix}/${additional.Filename}` })
  //   }

  //   return { sourceFiles: result, targetFilePath }
  // }
}
