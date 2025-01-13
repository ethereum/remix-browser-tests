/* global describe, before, it */
import { Web3 } from 'web3'
import { Provider } from '../src/index'
const web3 = new Web3()
import * as assert from 'assert'

describe('blocks', () => {
  before(async () => {
    const provider = new Provider({
      coinbase: '0x0000000000000000000000000000000000000001'
    })
    await provider.init()
    web3.setProvider(provider as any)
  })

  describe('eth_getBlockByNumber', () => {
    it('should get block given its number', async () => {
      const block = await web3.eth.getBlock(0)

      const expectedBlock = {
        baseFeePerGas: '1',
        difficulty: '0',
        extraData: '0x0',
        gasLimit: '8000000',
        gasUsed: '0',
        hash: block.hash.toString(),
        logsBloom: '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e670ec64341771606e55d6b4ca35a1a6b75ee3d5145a99d05921026d1527331',
        miner: '0x0000000000000000000000000000000000000001',
        nonce: '0',
        number: '0',
        parentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        sha3Uncles: '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
        size: '163591',
        stateRoot: '0x0000000000000000000000000000000000000000000000000000000000000000',
        timestamp: block.timestamp,
        totalDifficulty: '0',
        transactionsRoot: '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
        uncles: []
      }

      assert.deepEqual(block, expectedBlock)
    })
  })

  describe('eth_getGasPrice', () => {
    it('should get gas price', async () => {
      const gasPrice = await web3.eth.getGasPrice()
      assert.equal(gasPrice, 1)
    })
  })

  describe('eth_coinbase', () => {
    it('should get coinbase', async () => {
      const coinbase = await web3.eth.getCoinbase()
      assert.equal(coinbase, '0x0000000000000000000000000000000000000001')
    })
  })

  describe('eth_blockNumber', () => {
    it('should get current block number', async () => {
      const number = await web3.eth.getBlockNumber()
      assert.equal(number, 0)
    })
  })

  describe('evm_mine', () => {
    it('should mine empty block using evm_mine', async function () {
      await web3.provider.request({
        method: 'evm_mine',
        params: [{ blocks: 3 }],
      })
      const number = await web3.eth.getBlockNumber()
      assert.equal(number, 3)
    })
  })

  describe('eth_getBlockByHash', () => {
    it('should get block given its hash', async () => {
      const correctBlock = await web3.eth.getBlock(0)
      const block = await web3.eth.getBlock(correctBlock.hash)

      assert.deepEqual(block, correctBlock)
    })
  })

  describe('eth_getBlockTransactionCountByHash', () => {
    it('should get block given its hash', async () => {
      const correctBlock = await web3.eth.getBlock(0)
      const numberTransactions = await web3.eth.getBlockTransactionCount(correctBlock.hash)

      assert.deepEqual(numberTransactions, 0)
    })
  })

  describe('eth_getBlockTransactionCountByNumber', () => {
    it('should get block given its hash', async () => {
      const numberTransactions = await web3.eth.getBlockTransactionCount(0)

      assert.deepEqual(numberTransactions, 0)
    })
  })

  describe('eth_getUncleCountByBlockHash', () => {
    it('should get block given its hash', async () => {
      const correctBlock = await web3.eth.getBlock(0)
      const numberTransactions = await (new Promise((resolve, reject) => {
        web3['_requestManager'].send({ method: 'eth_getUncleCountByBlockHash', params: [correctBlock.hash]})
          .then(numberTransactions => resolve(numberTransactions))
          .catch(err => reject(err))
      }))
      assert.deepEqual(numberTransactions, correctBlock.uncles.length)
    })
  })

  describe('eth_getUncleCountByBlockNumber', () => {
    it('should get block given its number', async () => {
      const correctBlock = await web3.eth.getBlock(0)
      const numberTransactions = await (new Promise((resolve, reject) => {
        web3['_requestManager'].send({ method: 'eth_getUncleCountByBlockHash', params: [0]})
          .then(numberTransactions => resolve(numberTransactions))
          .catch(err => reject(err))
      }))
      assert.deepEqual(numberTransactions, correctBlock.uncles.length)
    })
  })
  describe('eth_getStorageAt', () => {
    it('should get storage at position at given address', async () => {
      const abi = [
        {
          'constant': false,
          'inputs': [
            {
              'name': 'x',
              'type': 'uint256'
            }
          ],
          'name': 'set',
          'outputs': [],
          'payable': false,
          'stateMutability': 'nonpayable',
          'type': 'function'
        },
        {
          'constant': false,
          'inputs': [
            {
              'name': 'x',
              'type': 'uint256'
            }
          ],
          'name': 'set2',
          'outputs': [],
          'payable': false,
          'stateMutability': 'nonpayable',
          'type': 'function'
        },
        {
          'inputs': [
            {
              'name': 'initialValue',
              'type': 'uint256'
            }
          ],
          'payable': false,
          'stateMutability': 'nonpayable',
          'type': 'constructor'
        },
        {
          'anonymous': false,
          'inputs': [
            {
              'indexed': true,
              'name': 'value',
              'type': 'uint256'
            }
          ],
          'name': 'Test',
          'type': 'event'
        },
        {
          'constant': true,
          'inputs': [],
          'name': 'get',
          'outputs': [
            {
              'name': 'retVal',
              'type': 'uint256'
            }
          ],
          'payable': false,
          'stateMutability': 'view',
          'type': 'function'
        },
        {
          'constant': true,
          'inputs': [],
          'name': 'storedData',
          'outputs': [
            {
              'name': '',
              'type': 'uint256'
            }
          ],
          'payable': false,
          'stateMutability': 'view',
          'type': 'function'
        }
      ] as const

      const code = '0x608060405234801561001057600080fd5b506040516020806102018339810180604052602081101561003057600080fd5b810190808051906020019092919050505080600081905550506101a9806100586000396000f3fe60806040526004361061005c576000357c0100000000000000000000000000000000000000000000000000000000900480632a1afcd91461006157806360fe47b11461008c5780636d4ce63c146100c7578063ce01e1ec146100f2575b600080fd5b34801561006d57600080fd5b5061007661012d565b6040518082815260200191505060405180910390f35b34801561009857600080fd5b506100c5600480360360208110156100af57600080fd5b8101908080359060200190929190505050610133565b005b3480156100d357600080fd5b506100dc61013d565b6040518082815260200191505060405180910390f35b3480156100fe57600080fd5b5061012b6004803603602081101561011557600080fd5b8101908080359060200190929190505050610146565b005b60005481565b8060008190555050565b60008054905090565b80600081905550807f63a242a632efe33c0e210e04e4173612a17efa4f16aa4890bc7e46caece80de060405160405180910390a25056fea165627a7a7230582063160eb16dc361092a85ced1a773eed0b63738b83bea1e1c51cf066fa90e135d0029'

      const contract = new web3.eth.Contract(abi)
      const accounts = await web3.eth.getAccounts()

      const contractInstance: any = await contract.deploy({ data: code, arguments: [100]}).send({ from: accounts[0], gas: '400000' })
      contractInstance.currentProvider = web3.eth.currentProvider
      // contractInstance.givenProvider = web3.eth.currentProvider

      await contractInstance.methods.set(100).send({ from: accounts[0].toLowerCase(), gas: 400000 })
      let storage = await web3.eth.getStorageAt(contractInstance.options.address, 0)
      assert.deepEqual(storage, '0x64')

      await contractInstance.methods.set(200).send({ from: accounts[0].toLowerCase(), gas: 400000 })
      storage = await web3.eth.getStorageAt(contractInstance.options.address, 0)
      assert.deepEqual(storage, '0xc8')

      await contractInstance.methods.set(1).send({ from: accounts[0].toLowerCase(), gas: 400000 })
      storage = await web3.eth.getStorageAt(contractInstance.options.address, 0)
      assert.deepEqual(storage, '0x01')
    })
  })
  describe('eth_call', () => {
    it('should get a value', async () => {
      const abi = [
        {
          'constant': false,
          'inputs': [
            {
              'name': 'x',
              'type': 'uint256'
            }
          ],
          'name': 'set',
          'outputs': [],
          'payable': false,
          'stateMutability': 'nonpayable',
          'type': 'function'
        },
        {
          'constant': false,
          'inputs': [
            {
              'name': 'x',
              'type': 'uint256'
            }
          ],
          'name': 'set2',
          'outputs': [],
          'payable': false,
          'stateMutability': 'nonpayable',
          'type': 'function'
        },
        {
          'inputs': [
            {
              'name': 'initialValue',
              'type': 'uint256'
            }
          ],
          'payable': false,
          'stateMutability': 'nonpayable',
          'type': 'constructor'
        },
        {
          'anonymous': false,
          'inputs': [
            {
              'indexed': true,
              'name': 'value',
              'type': 'uint256'
            }
          ],
          'name': 'Test',
          'type': 'event'
        },
        {
          'constant': true,
          'inputs': [],
          'name': 'get',
          'outputs': [
            {
              'name': 'retVal',
              'type': 'uint256'
            }
          ],
          'payable': false,
          'stateMutability': 'view',
          'type': 'function'
        },
        {
          'constant': true,
          'inputs': [],
          'name': 'storedData',
          'outputs': [
            {
              'name': '',
              'type': 'uint256'
            }
          ],
          'payable': false,
          'stateMutability': 'view',
          'type': 'function'
        }
      ] as const

      const code = '0x608060405234801561001057600080fd5b506040516020806102018339810180604052602081101561003057600080fd5b810190808051906020019092919050505080600081905550506101a9806100586000396000f3fe60806040526004361061005c576000357c0100000000000000000000000000000000000000000000000000000000900480632a1afcd91461006157806360fe47b11461008c5780636d4ce63c146100c7578063ce01e1ec146100f2575b600080fd5b34801561006d57600080fd5b5061007661012d565b6040518082815260200191505060405180910390f35b34801561009857600080fd5b506100c5600480360360208110156100af57600080fd5b8101908080359060200190929190505050610133565b005b3480156100d357600080fd5b506100dc61013d565b6040518082815260200191505060405180910390f35b3480156100fe57600080fd5b5061012b6004803603602081101561011557600080fd5b8101908080359060200190929190505050610146565b005b60005481565b8060008190555050565b60008054905090565b80600081905550807f63a242a632efe33c0e210e04e4173612a17efa4f16aa4890bc7e46caece80de060405160405180910390a25056fea165627a7a7230582063160eb16dc361092a85ced1a773eed0b63738b83bea1e1c51cf066fa90e135d0029'

      const contract = new web3.eth.Contract(abi)
      const accounts = await web3.eth.getAccounts()

      const contractInstance: any = await contract.deploy({ data: code, arguments: [100]}).send({ from: accounts[0], gas: '400000' })
      contractInstance.currentProvider = web3.eth.currentProvider

      const value = await contractInstance.methods.get().call({ from: accounts[0] })
      assert.deepEqual(value, 100)
    })
  })
})
