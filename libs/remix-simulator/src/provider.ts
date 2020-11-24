import { Blocks } from './methods/blocks'
import { execution } from '@remix-project/remix-lib'
const { executionContext } = execution

import { info } from './utils/logs'
import merge from 'merge'

import { Accounts } from './methods/accounts'
import { Filters } from './methods/filters'
import { methods as miscMethods } from './methods/misc'
import { methods as netMethods } from './methods/net'
import { Transactions } from './methods/transactions'
import { Debug } from './methods/debug'
import { generateBlock } from './genesis'

export class Provider {
  options
  executionContext
  Accounts
  Transactions
  methods

  constructor (options = {}) {
    this.options = options
    // TODO: init executionContext here
    this.executionContext = executionContext
    this.Accounts = new Accounts(this.executionContext)
    this.Transactions = new Transactions(this.executionContext)

    this.methods = {}
    this.methods = merge(this.methods, this.Accounts.methods())
    this.methods = merge(this.methods, (new Blocks(this.executionContext, options)).methods())
    this.methods = merge(this.methods, miscMethods())
    this.methods = merge(this.methods, (new Filters(this.executionContext)).methods())
    this.methods = merge(this.methods, netMethods())
    this.methods = merge(this.methods, this.Transactions.methods())
    this.methods = merge(this.methods, (new Debug(this.executionContext)).methods())

    generateBlock(this.executionContext)
    this.init()
  }

  async init () {
    await this.Accounts.resetAccounts()
    this.Transactions.init(this.Accounts.accounts)
  }

  sendAsync (payload, callback) {
    // log.info('payload method is ', payload.method) // commented because, this floods the IDE console

    const method = this.methods[payload.method]
    if (this.options.logDetails) {
      info(payload)
    }
    if (method) {
      return method.call(method, payload, (err, result) => {
        if (this.options.logDetails) {
          info(err)
          info(result)
        }
        if (err) {
          return callback(err)
        }
        const response = { id: payload.id, jsonrpc: '2.0', result: result }
        callback(null, response)
      })
    }
    callback(new Error('unknown method ' + payload.method))
  }

  send (payload, callback) {
    this.sendAsync(payload, callback || function () {})
  }

  isConnected () {
    return true
  }

  on (type, cb) {
    this.executionContext.logsManager.addListener(type, cb)
  }
}
