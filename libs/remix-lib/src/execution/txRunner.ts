'use strict'
import { EventManager } from '../eventManager'

export type Transaction = {
  from: string,
  fromSmartAccount: boolean,
  to: string,
  value: string,
  data: string,
  gasLimit: number,
  useCall: boolean,
  timestamp?: number
  type: '0x1' | '0x2'
}

export class TxRunner {
  event
  pendingTxs
  queusTxs
  opt
  internalRunner
  constructor (internalRunner, opt) {
    this.opt = opt || {}
    this.internalRunner = internalRunner
    this.event = new EventManager()

    this.pendingTxs = {}
    this.queusTxs = []
  }

  rawRun (args: Transaction, confirmationCb, gasEstimationForceSend, promptCb, cb) {
    run(this, args, args.timestamp || Date.now(), confirmationCb, gasEstimationForceSend, promptCb, cb)
  }

  execute (args: Transaction, confirmationCb, gasEstimationForceSend, promptCb, callback) {
    let data = args.data
    if (data.slice(0, 2) !== '0x') {
      data = '0x' + data
    }
    this.internalRunner.execute(args, confirmationCb, gasEstimationForceSend, promptCb, callback)
  }
}

function run (self, tx: Transaction, stamp, confirmationCb, gasEstimationForceSend = null, promptCb = null, callback = null) {
  if (Object.keys(self.pendingTxs).length) {
    return self.queusTxs.push({ tx, stamp, confirmationCb, gasEstimationForceSend, promptCb, callback })
  }
  self.pendingTxs[stamp] = tx
  self.execute(tx, confirmationCb, gasEstimationForceSend, promptCb, function (error, result) {
    delete self.pendingTxs[stamp]
    if (callback && typeof callback === 'function') callback(error, result)
    if (self.queusTxs.length) {
      const next = self.queusTxs.pop()
      run(self, next.tx, next.stamp, next.confirmationCb, next.gasEstimationForceSend, next.promptCb, next.callback)
    }
  })
}
