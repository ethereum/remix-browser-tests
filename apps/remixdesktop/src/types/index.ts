
export interface RequestArguments {
  jsonrpc: '2.0'
  readonly method: string
  readonly params?: readonly unknown[] | object
  readonly id?: string
}

export type Chain = {
  chainId: number
  name: string
  currency: string
  explorerUrl: string
  rpcUrl: string
}