import type { ContractABI } from '../types'

export abstract class AbstractAbiProvider {
  constructor(public apiUrl: string, public explorerUrl: string) { }

  abstract lookupABI(contractAddress: string): Promise<ContractABI>
  abstract lookupBytecode(contractAddress: string): Promise<String>

  /**
   * Fetch data from provider.
   *
   * @param url - URL to fetch the data from.
   * @returns An JSON response from the provider of type `T`.
   */
  static async fetch<T>(url: string): Promise<T> {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: new Headers({ 'Content-Type': 'application/json' }),
      });

      if (!response.ok) {
        console.error(`ERROR fetching data from URL: ${url}`);
        throw new Error(`ERROR fetching data from URL: ${url}`);
      }

      return await response.json()
    } catch (error) {
      console.error('An error occurred while fetching data:', error);
      throw new Error('An error occurred while fetching data:' + error);
    }
  }
}
