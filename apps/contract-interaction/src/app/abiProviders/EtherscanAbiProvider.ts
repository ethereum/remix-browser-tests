import { AbstractAbiProvider } from './AbstractAbiProvider'
import { ContractABI, ABICategoryBlockScout } from '../types'
import { FuncABI } from '@remix-project/core-plugin'

export class EtherscanAbiProvider extends AbstractAbiProvider {
  LOOKUP_STORE_DIR = 'etherscan-verified'

  constructor(apiUrl: string, explorerUrl: string, protected apiKey?: string) {
    super(apiUrl, explorerUrl)
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

  async lookupABI(contractAddress: string): Promise<ContractABI> {

    // TODO try-catch
    const parsedReadABI = await AbstractAbiProvider.fetch<FuncABI[]>(this.getAbiURL(contractAddress, ABICategoryBlockScout.Read))
    const parsedWriteABI = await AbstractAbiProvider.fetch<FuncABI[]>(this.getAbiURL(contractAddress, ABICategoryBlockScout.Write))
    const parsedProxyReadABI = await AbstractAbiProvider.fetch<FuncABI[]>(this.getAbiURL(contractAddress, ABICategoryBlockScout.ProxyRead))
    const parsedProxyWriteABI = await AbstractAbiProvider.fetch<FuncABI[]>(this.getAbiURL(contractAddress, ABICategoryBlockScout.ProxyWrite))

    return {
      Read: parsedReadABI,
      Write: parsedWriteABI,
      ProxyRead: parsedProxyReadABI,
      ProxyWrite: parsedProxyWriteABI
    }
  }

  /**
   * Get the blockexplorer specific URL for fetching the raw bytecode of a smart contract.
   *
   * @param contractAddress - The contract address.
   * @returns The url to fetch the raw bytecode data.
   */
  getBytecodeURL(contractAddress: string): string {
    // TODO: get correct URL
    const url = new URL(this.explorerUrl + `/api?module=contract&action=getsourcecode&address=${contractAddress}`)
    return url.href
  }

  async lookupBytecode(contractAddress: string): Promise<String> {
    // TODO try-catch
    return await AbstractAbiProvider.fetch<String>(this.getBytecodeURL(contractAddress))
  }
}

// interface EtherscanRpcResponse {
//   status: '0' | '1'
//   message: string
//   result: string
// }

// interface EtherscanCheckStatusResponse {
//   status: '0' | '1'
//   message: string
//   result: 'Pending in queue' | 'Pass - Verified' | 'Fail - Unable to verify' | 'Already Verified' | 'Unknown UID'
// }

// interface EtherscanSource {
//   SourceCode: string
//   ABI: string
//   ContractName: string
//   CompilerVersion: string
//   OptimizationUsed: string
//   Runs: string
//   ConstructorArguments: string
//   EVMVersion: string
//   Library: string
//   LicenseType: string
//   Proxy: string
//   Implementation: string
//   SwarmSource: string
// }

// interface EtherscanGetSourceCodeResponse {
//   status: '0' | '1'
//   message: string
//   result: EtherscanSource[]
// }


// async verify(submittedContract: SubmittedContract, compilerAbstract: CompilerAbstract): Promise<VerificationResponse> {
//   // TODO: Handle version Vyper contracts. This relies on Solidity metadata.
//   const metadata = JSON.parse(compilerAbstract.data.contracts[submittedContract.filePath][submittedContract.contractName].metadata)
//   const formData = new FormData()
//   formData.append('chainId', submittedContract.chainId)
//   formData.append('codeformat', 'solidity-standard-json-input')
//   formData.append('sourceCode', compilerAbstract.input.toString())
//   formData.append('contractaddress', submittedContract.address)
//   formData.append('contractname', submittedContract.filePath + ':' + submittedContract.contractName)
//   formData.append('compilerversion', `v${metadata.compiler.version}`)
//   formData.append('constructorArguements', submittedContract.abiEncodedConstructorArgs?.replace('0x', '') ?? '')

//   const url = new URL(this.apiUrl + '/api')
//   url.searchParams.append('module', 'contract')
//   url.searchParams.append('action', 'verifysourcecode')
//   if (this.apiKey) {
//     url.searchParams.append('apikey', this.apiKey)
//   }

//   const response = await fetch(url.href, {
//     method: 'POST',
//     body: formData,
//   })

//   if (!response.ok) {
//     const responseText = await response.text()
//     console.error('Error on Etherscan API verification at ' + this.apiUrl + '\nStatus: ' + response.status + '\nResponse: ' + responseText)
//     throw new Error(responseText)
//   }

//   const verificationResponse: EtherscanRpcResponse = await response.json()

//   if (verificationResponse.result.includes('already verified')) {
//     return { status: 'already verified', receiptId: null, lookupUrl: this.getContractCodeUrl(submittedContract.address) }
//   }

//   if (verificationResponse.status !== '1' || verificationResponse.message !== 'OK') {
//     console.error('Error on Etherscan API verification at ' + this.apiUrl + '\nStatus: ' + verificationResponse.status + '\nMessage: ' + verificationResponse.message + '\nResult: ' + verificationResponse.result)
//     throw new Error(verificationResponse.result)
//   }

//   const lookupUrl = this.getContractCodeUrl(submittedContract.address)
//   return { status: 'pending', receiptId: verificationResponse.result, lookupUrl }
// }

// async verifyProxy(submittedContract: SubmittedContract): Promise<VerificationResponse> {
//   if (!submittedContract.proxyAddress) {
//     throw new Error('SubmittedContract does not have a proxyAddress')
//   }

//   const formData = new FormData()
//   formData.append('address', submittedContract.proxyAddress)
//   formData.append('expectedimplementation', submittedContract.address)

//   const url = new URL(this.apiUrl + '/api')
//   url.searchParams.append('module', 'contract')
//   url.searchParams.append('action', 'verifyproxycontract')
//   if (this.apiKey) {
//     url.searchParams.append('apikey', this.apiKey)
//   }

//   const response = await fetch(url.href, {
//     method: 'POST',
//     body: formData,
//   })

//   if (!response.ok) {
//     const responseText = await response.text()
//     console.error('Error on Etherscan API proxy verification at ' + this.apiUrl + '\nStatus: ' + response.status + '\nResponse: ' + responseText)
//     throw new Error(responseText)
//   }

//   const verificationResponse: EtherscanRpcResponse = await response.json()

//   if (verificationResponse.status !== '1' || verificationResponse.message !== 'OK') {
//     console.error('Error on Etherscan API proxy verification at ' + this.apiUrl + '\nStatus: ' + verificationResponse.status + '\nMessage: ' + verificationResponse.message + '\nResult: ' + verificationResponse.result)
//     throw new Error(verificationResponse.result)
//   }

//   return { status: 'pending', receiptId: verificationResponse.result }
// }

// async checkVerificationStatus(receiptId: string): Promise<VerificationResponse> {
//   const url = new URL(this.apiUrl + '/api')
//   url.searchParams.append('module', 'contract')
//   url.searchParams.append('action', 'checkverifystatus')
//   url.searchParams.append('guid', receiptId)
//   if (this.apiKey) {
//     url.searchParams.append('apikey', this.apiKey)
//   }

//   const response = await fetch(url.href, { method: 'GET' })

//   if (!response.ok) {
//     const responseText = await response.text()
//     console.error('Error on Etherscan API check verification status at ' + this.apiUrl + '\nStatus: ' + response.status + '\nResponse: ' + responseText)
//     throw new Error(responseText)
//   }

//   const checkStatusResponse: EtherscanCheckStatusResponse = await response.json()

//   if (checkStatusResponse.result.startsWith('Fail - Unable to verify')) {
//     return { status: 'failed', receiptId, message: checkStatusResponse.result }
//   }
//   if (checkStatusResponse.result === 'Pending in queue') {
//     return { status: 'pending', receiptId }
//   }
//   if (checkStatusResponse.result === 'Pass - Verified') {
//     return { status: 'verified', receiptId }
//   }
//   if (checkStatusResponse.result === 'Already Verified') {
//     return { status: 'already verified', receiptId }
//   }
//   if (checkStatusResponse.result === 'Unknown UID') {
//     console.error('Error on Etherscan API check verification status at ' + this.apiUrl + '\nStatus: ' + checkStatusResponse.status + '\nMessage: ' + checkStatusResponse.message + '\nResult: ' + checkStatusResponse.result)
//     return { status: 'failed', receiptId, message: checkStatusResponse.result }
//   }

//   if (checkStatusResponse.status !== '1' || !checkStatusResponse.message.startsWith('OK')) {
//     console.error('Error on Etherscan API check verification status at ' + this.apiUrl + '\nStatus: ' + checkStatusResponse.status + '\nMessage: ' + checkStatusResponse.message + '\nResult: ' + checkStatusResponse.result)
//     throw new Error(checkStatusResponse.result)
//   }

//   return { status: 'unknown', receiptId }
// }

// async checkProxyVerificationStatus(receiptId: string): Promise<VerificationResponse> {
//   const url = new URL(this.apiUrl + '/api')
//   url.searchParams.append('module', 'contract')
//   url.searchParams.append('action', 'checkproxyverification')
//   url.searchParams.append('guid', receiptId)
//   if (this.apiKey) {
//     url.searchParams.append('apikey', this.apiKey)
//   }

//   const response = await fetch(url.href, { method: 'GET' })

//   if (!response.ok) {
//     const responseText = await response.text()
//     console.error('Error on Etherscan API check verification status at ' + this.apiUrl + '\nStatus: ' + response.status + '\nResponse: ' + responseText)
//     throw new Error(responseText)
//   }

//   const checkStatusResponse: EtherscanRpcResponse = await response.json()

//   if (checkStatusResponse.result === 'A corresponding implementation contract was unfortunately not detected for the proxy address.' || checkStatusResponse.result === 'The provided expected results are different than the retrieved implementation address!' || checkStatusResponse.result === 'This contract does not look like it contains any delegatecall opcode sequence.') {
//     return { status: 'failed', receiptId, message: checkStatusResponse.result }
//   }
//   if (checkStatusResponse.result === 'Verification in progress') {
//     return { status: 'pending', receiptId }
//   }
//   if (checkStatusResponse.result.startsWith("The proxy's") && checkStatusResponse.result.endsWith('and is successfully updated.')) {
//     return { status: 'verified', receiptId }
//   }
//   if (checkStatusResponse.result === 'Unknown UID') {
//     console.error('Error on Etherscan API check proxy verification status at ' + this.apiUrl + '\nStatus: ' + checkStatusResponse.status + '\nMessage: ' + checkStatusResponse.message + '\nResult: ' + checkStatusResponse.result)
//     return { status: 'failed', receiptId, message: checkStatusResponse.result }
//   }

//   if (checkStatusResponse.status !== '1' || !checkStatusResponse.message.startsWith('OK')) {
//     console.error('Error on Etherscan API check proxy verification status at ' + this.apiUrl + '\nStatus: ' + checkStatusResponse.status + '\nMessage: ' + checkStatusResponse.message + '\nResult: ' + checkStatusResponse.result)
//     throw new Error(checkStatusResponse.result)
//   }

//   return { status: 'unknown', receiptId }
// }


//   async lookup(contractAddress: string, chainId: string): Promise<LookupResponse> {
//     const url = new URL(this.apiUrl + '/api')
//     url.searchParams.append('module', 'contract')
//     url.searchParams.append('action', 'getsourcecode')
//     url.searchParams.append('address', contractAddress)
//     if (this.apiKey) {
//       url.searchParams.append('apikey', this.apiKey)
//     }

//     const response = await fetch(url.href, { method: 'GET' })

//     if (!response.ok) {
//       const responseText = await response.text()
//       console.error('Error on Etherscan API lookup at ' + this.apiUrl + '\nStatus: ' + response.status + '\nResponse: ' + responseText)
//       throw new Error(responseText)
//     }

//     const lookupResponse: EtherscanGetSourceCodeResponse = await response.json()

//     if (lookupResponse.status !== '1' || !lookupResponse.message.startsWith('OK')) {
//       const errorResponse = lookupResponse as unknown as EtherscanRpcResponse
//       console.error('Error on Etherscan API lookup at ' + this.apiUrl + '\nStatus: ' + errorResponse.status + '\nMessage: ' + errorResponse.message + '\nResult: ' + errorResponse.result)
//       throw new Error(errorResponse.result)
//     }

//     if (lookupResponse.result[0].ABI === 'Contract source code not verified' || !lookupResponse.result[0].SourceCode) {
//       return { status: 'not verified' }
//     }

//     const lookupUrl = this.getContractCodeUrl(contractAddress)
//     const { sourceFiles, targetFilePath } = this.processReceivedFiles(lookupResponse.result[0], contractAddress, chainId)

//     return { status: 'verified', lookupUrl, sourceFiles, targetFilePath }
//   }

//   getContractCodeUrl(address: string): string {
//     const url = new URL(this.explorerUrl + `/address/${address}#code`)
//     return url.href
//   }

//   processReceivedFiles(source: EtherscanSource, contractAddress: string, chainId: string): { sourceFiles: SourceFile[]; targetFilePath?: string } {
//     const filePrefix = `/${this.LOOKUP_STORE_DIR}/${chainId}/${contractAddress}`

//     // Covers the cases:
//     // SourceFile: {[FileName]: [content]}
//     // SourceFile: {{sources: {[FileName]: [content]}}}
//     let parsedFiles: any
//     try {
//       parsedFiles = JSON.parse(source.SourceCode)
//     } catch (e) {
//       try {
//         // Etherscan wraps the Object in one additional bracket
//         parsedFiles = JSON.parse(source.SourceCode.substring(1, source.SourceCode.length - 1)).sources
//       } catch (e) { }
//     }

//     if (parsedFiles) {
//       const result: SourceFile[] = []
//       let targetFilePath = ''
//       for (const [fileName, fileObj] of Object.entries<any>(parsedFiles)) {
//         const path = `${filePrefix}/${fileName}`

//         result.push({ path, content: fileObj.content })

//         if (path.endsWith(`/${source.ContractName}.sol`)) {
//           targetFilePath = path
//         }
//       }
//       return { sourceFiles: result, targetFilePath }
//     }

//     // Parsing to JSON failed, SourceCode is the code itself
//     const targetFilePath = `${filePrefix}/${source.ContractName}.sol`
//     const sourceFiles: SourceFile[] = [{ content: source.SourceCode, path: targetFilePath }]
//     return { sourceFiles, targetFilePath }
//   }
//