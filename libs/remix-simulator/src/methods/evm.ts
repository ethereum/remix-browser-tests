import { Block } from '@ethereumjs/block'
import { ConsensusType } from '@ethereumjs/common'
import type { VMContext } from '../vm-context'
import type { Transactions } from '../methods/transactions'

export class EVM {
  vmContext: VMContext
  transactions: Transactions

  constructor (vmContext: VMContext, transactions: Transactions) {
    this.vmContext = vmContext
    this.transactions = transactions
  }

  methods () {
    return {
      evm_setAutomine: this.evm_setAutomine.bind(this),
      evm_setIntervalMining: this.evm_setIntervalMining.bind(this),
      evm_snapshot: this.evm_snapshot.bind(this),
      evm_revert: this.evm_revert.bind(this),
      evm_increaseTime: this.evm_increaseTime.bind(this),
      evm_setNextBlockTimestamp: this.evm_setNextBlockTimestamp.bind(this),
      evm_setBlockGasLimit: this.evm_setBlockGasLimit.bind(this),
      evm_mine: this.evm_mine.bind(this)
    }
  }

  evm_setAutomine (payload, cb) {
    // always on
    cb()
  }

  evm_setIntervalMining (payload, cb) {
    cb()
  }

  evm_snapshot (payload, cb) {
    cb()
  }

  evm_revert (payload, cb) {
    cb()
  }

  evm_increaseTime (payload, cb) {
    cb()
  }

  evm_setNextBlockTimestamp (payload, cb) {
    cb()
  }

  evm_setBlockGasLimit (payload, cb) {
    cb()
  }

  async evm_mine (payload, cb) {
    const runEmptyBlock = () => {
      return new Promise((resolve, reject) => {
        this.transactions.txRunnerVMInstance.runEmptyBlock((error, result) => {
          if (error) {
            reject(error)
            return
          }
          this.vmContext.addBlock(result.block, false, true)
          resolve(result)
        })
      })
    }

    const blocks = payload.params[0].blocks

    for (let b = 0; b < Number(blocks); b++) {
      await runEmptyBlock()
      console.log('mining...', b, this.vmContext.latestBlockNumber)
    }
    cb()
  }
}
