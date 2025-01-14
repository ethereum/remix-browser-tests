export type JsonDataRequest = {
    id: number
    jsonrpc: string // version
    method: string
    params: Array<any>
  }
  
  export type JsonDataResult = {
    id: number
    jsonrpc: string // version
    result?: any
    error?: {
      code: number,
      message: string
      data?: string
    }
    errorData?: any
  }