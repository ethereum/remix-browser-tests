import { PluginClient } from "@remixproject/plugin"
import axios from 'axios'
type RemixClient = PluginClient

export const getEtherScanApi = (network: string) => {
  return network === "main"
    ? `https://api.etherscan.io/api`
    : `https://api-${network}.etherscan.io/api`
}

export const getNetworkName = async (client: RemixClient) => {
  const network = await client.call("network", "detectNetwork")
  if (!network) {
    throw new Error("no known network to verify against")
  }
  return network.name!.toLowerCase()
}

export const getReceiptStatus = async (
  receiptGuid: string,
  apiKey: string,
  etherscanApi: string
) => {
  const params = `guid=${receiptGuid}&module=contract&action=checkverifystatus&apiKey=${apiKey}`
  try {
    const response = await axios.get(`${etherscanApi}?${params}`)
    const { result } = response.data
    return result
  } catch (error) {
    console.error(error)
  }
}
