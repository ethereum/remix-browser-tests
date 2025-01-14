'use strict'
import { RunBlockResult, RunTxResult } from '@ethereumjs/vm'
import { ConsensusType } from '@ethereumjs/common'
import { LegacyTransaction, FeeMarketEIP1559Transaction } from '@ethereumjs/tx'
import { Block } from '@ethereumjs/block'
import { bytesToHex, Address, hexToBytes } from '@ethereumjs/util'
import { EVM } from '@ethereumjs/evm'
import type { Account, AddressLike, BigIntLike } from '@ethereumjs/util'
import { EventManager } from '../eventManager'
import { LogsManager } from './logsManager'
import type { Transaction as InternalTransaction } from './txRunner'

export type VMexecutionResult = {
  result: RunTxResult,
  transactionHash: string
  block: Block,
  tx: LegacyTransaction
}

export type VMExecutionCallBack = (error: string | Error, result?: VMexecutionResult) => void

export class TxRunnerVM {
  event
  blockNumber
  pendingTxs
  vmaccounts
  queusTxs
  blocks: Uint8Array[]
  logsManager
  commonContext
  blockParentHash
  nextNonceForCall: number
  standaloneTx: boolean
  getVMObject: () => any

  constructor (vmaccounts, api, getVMObject, blocks: Uint8Array[] = []) {
    this.event = new EventManager()
    this.logsManager = new LogsManager()
    // has a default for now for backwards compatibility
    this.getVMObject = getVMObject
    this.commonContext = this.getVMObject().common
    this.pendingTxs = {}
    this.vmaccounts = vmaccounts
    this.queusTxs = []
    /*
      txHash is generated using the nonce,
      in order to have unique transaction hash, we need to keep using different nonce (in case of a call)
      so we increment this value after each call.
      For this to function we also need to skip nonce validation, in the vm: `{ skipNonce: true }`
    */
    this.nextNonceForCall = 0

    const vm = this.getVMObject().vm
    if (Array.isArray(blocks) && (blocks || []).length > 0) {
      const lastBlock = Block.fromRLPSerializedBlock(blocks[blocks.length - 1], { common: this.commonContext })

      this.blockParentHash = lastBlock.hash()
      this.blocks = blocks
    } else {
      this.blockParentHash = vm.blockchain.genesisBlock.hash()
      this.blocks = [vm.blockchain.genesisBlock.serialize()]
    }
  }

  execute (args: InternalTransaction, confirmationCb, gasEstimationForceSend, promptCb, callback: VMExecutionCallBack) {
    let data = args.data
    if (data.slice(0, 2) !== '0x') {
      data = '0x' + data
    }

    try {
      this.runInVm(args, callback)
    } catch (e) {
      callback(e, null)
    }
  }

  runEmptyBlock (callback: VMExecutionCallBack) {
    const EIP1559 = this.commonContext.hardfork() !== 'berlin' // berlin is the only pre eip1559 fork that we handle.
    const coinbases = ['0x0e9281e9c6a0808672eaba6bd1220e144c9bb07a', '0x8945a1288dc78a6d8952a92c77aee6730b414778', '0x94d76e24f818426ae84aa404140e8d5f60e10e7e']
    const difficulties = [69762765929000, 70762765929000, 71762765929000]
    const difficulty = this.commonContext.consensusType() === ConsensusType.ProofOfStake ? 0 : difficulties[this.blocks.length % difficulties.length]
    const block = Block.fromBlockData({
      header: {
        timestamp: new Date().getTime() / 1000 | 0,
        number: this.blocks.length,
        coinbase: coinbases[this.blocks.length % coinbases.length],
        difficulty,
        gasLimit: 0,
        baseFeePerGas: EIP1559 ? '0x1' : undefined,
        parentHash: this.blockParentHash
      }
    }, { common: this.commonContext })

    this.blockParentHash = block.hash()
    this.runBlockInVm(null, block, async (err, result) => {
      if (!err) {
        this.getVMObject().vm.blockchain.putBlock(block)
        this.blocks.push(block.serialize())
      }
      callback(err, result)
    })
  }

  async runInVm (tx: InternalTransaction, callback: VMExecutionCallBack) {
    const { to, data, value, gasLimit, useCall, signed } = tx
    let { from } = tx
    let account

    try {
      const EIP1559 = this.commonContext.hardfork() !== 'berlin' // berlin is the only pre eip1559 fork that we handle.
      let tx
      if (signed) {
        if (!EIP1559) {
          tx = LegacyTransaction.fromSerializedTx(hexToBytes(data), { common: this.commonContext })
        } else {
          tx = FeeMarketEIP1559Transaction.fromSerializedTx(hexToBytes(data), { common: this.commonContext })
        }
      }
      else {
        if (!from && useCall && Object.keys(this.vmaccounts).length) {
          from = Object.keys(this.vmaccounts)[0]
          account = this.vmaccounts[from]
        } else account = this.vmaccounts[from]

        if (!account) {
          return callback('Invalid account selected')
        }

        const res = await this.getVMObject().stateManager.getAccount(Address.fromString(from))
        if (!EIP1559) {
          tx = LegacyTransaction.fromTxData({
            nonce: useCall ? this.nextNonceForCall : res.nonce,
            gasPrice: '0x1',
            gasLimit: gasLimit,
            to: (to as AddressLike),
            value: (value as BigIntLike),
            data: hexToBytes(data)
          }, { common: this.commonContext }).sign(account.privateKey)
        } else {
          tx = FeeMarketEIP1559Transaction.fromTxData({
            nonce: useCall ? this.nextNonceForCall : res.nonce,
            maxPriorityFeePerGas: '0x01',
            maxFeePerGas: '0x7',
            gasLimit: gasLimit,
            to: (to as AddressLike),
            value: (value as BigIntLike),
            data: hexToBytes(data)
          }).sign(account.privateKey)
        }
      }

      if (useCall) this.nextNonceForCall++

      const coinbases = ['0x0e9281e9c6a0808672eaba6bd1220e144c9bb07a', '0x8945a1288dc78a6d8952a92c77aee6730b414778', '0x94d76e24f818426ae84aa404140e8d5f60e10e7e']
      const difficulties = [69762765929000, 70762765929000, 71762765929000]
      const difficulty = this.commonContext.consensusType() === ConsensusType.ProofOfStake ? 0 : difficulties[this.blocks.length % difficulties.length]
      const block = Block.fromBlockData({
        header: {
          timestamp: new Date().getTime() / 1000 | 0,
          number: this.blocks.length,
          coinbase: coinbases[this.blocks.length % coinbases.length],
          difficulty,
          gasLimit,
          baseFeePerGas: EIP1559 ? '0x1' : undefined,
          parentHash: this.blockParentHash
        },
        transactions: [tx]
      }, { common: this.commonContext })

      // standaloneTx represents a gas estimation call
      if (this.standaloneTx || useCall) {
        const root = await this.getVMObject().stateManager.getStateRoot()
        this.runBlockInVm(tx, block, async (err, result) => {
          await this.getVMObject().stateManager.setStateRoot(root)
          callback(err, result)
        })
      } else {
        this.blockParentHash = block.hash()
        this.runBlockInVm(tx, block, async (err, result) => {
          if (!err) {
            if (!useCall) {
              this.getVMObject().vm.blockchain.putBlock(block)
              this.blocks.push(block.serialize())
            }
          }
          callback(err, result)
        })
      }
    } catch (e) {
      callback(e)
    }
  }

  runTxInVm (tx, block, callback) {
    this.getVMObject().vm.runTx({ tx, skipNonce: true, skipBlockValidation: true, skipBalance: false }).then((result: RunTxResult) => {
      callback(null, {
        result,
        transactionHash: bytesToHex(Buffer.from(tx.hash())),
        block,
        tx
      })
    }).catch(function (err) {
      callback(err)
    })
  }

  runBlockInVm (tx, block, callback) {
    this.getVMObject().vm.runBlock({ block: block, generate: true, skipNonce: true, skipBlockValidation: true, skipBalance: false }).then((results: RunBlockResult) => {
      const result: RunTxResult = results.results[0]
      callback(null, {
        result,
        transactionHash: tx ? bytesToHex(Buffer.from(tx.hash())) : null,
        block,
        tx
      })
    }).catch(function (err) {
      callback(err)
    })
  }
}
