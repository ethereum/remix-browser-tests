/* global describe, before, it */
import Web3 from 'web3'
import { Provider } from '../src/index'
const web3 = new Web3()
import * as assert from 'assert'

describe('Accounts', () => {
  before(function () {
    const provider: any = new Provider()
    web3.setProvider(provider)
  })

  describe('eth_getAccounts', () => {
    it('should get a list of accounts', async function () {
      const accounts = await web3.eth.getAccounts()
      assert.notEqual(accounts.length, 0)
    })
  })

  describe('eth_getBalance', () => {
    it('should get a account balance', async () => {
      const accounts = await web3.eth.getAccounts()
      const balance0 = await web3.eth.getBalance(accounts[0])
      const balance1 = await web3.eth.getBalance(accounts[1])
      const balance2 = await web3.eth.getBalance(accounts[2])

      assert.deepEqual(balance0, '100000000000000000000')
      assert.deepEqual(balance1, '100000000000000000000')
      assert.deepEqual(balance2, '100000000000000000000')
    })
  })

  describe('eth_sign', () => {
    it('should sign payloads', async () => {
      const accounts = await web3.eth.getAccounts()
      const signature = await web3.eth.sign('Hello world', accounts[0])

      assert.deepEqual(signature.length, 132)
    })
  })
})
