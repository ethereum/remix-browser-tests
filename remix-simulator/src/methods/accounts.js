var RemixLib = require('remix-lib')
var executionContext = RemixLib.execution.executionContext
var ethJSUtil = require('ethereumjs-util')
var BN = ethJSUtil.BN
var Web3 = require('web3')

var Accounts = function () {
  this.web3 = new Web3()
  // TODO: make it random and/or use remix-libs
  this.accounts = [this.web3.eth.accounts.create(['abcd']), this.web3.eth.accounts.create(['ef12']), this.web3.eth.accounts.create(['ef34'])]
  this.accountsKeys = {}

  executionContext.init({get: () => { return true }})

  for (let _account of this.accounts) {
    this.accountsKeys[_account.address.toLowerCase()] = _account.privateKey

    executionContext.vm().stateManager.getAccount(Buffer.from(_account.address.toLowerCase().replace("0x", ""), 'hex'), (err, account) => {
      var balance = '0x56BC75E2D63100000'
      account.balance = balance || '0xf00000000000000001'
    })
  }
}

Accounts.prototype.methods = function () {
  return {
    eth_accounts: this.eth_accounts.bind(this),
    eth_getBalance: this.eth_getBalance.bind(this),
    eth_sign: this.eth_sign.bind(this)
  }
}

Accounts.prototype.eth_accounts = function (payload, cb) {
  return cb(null, this.accounts.map((x) => x.address))
}

Accounts.prototype.eth_getBalance = function (payload, cb) {
  let address = payload.params[0]
  address = ethJSUtil.stripHexPrefix(address)

  executionContext.vm().stateManager.getAccount(Buffer.from(address, 'hex'), (err, account) => {
    if (err) {
      return cb('Account not found')
    }
    cb(null, new BN(account.balance).toString(10))
  })
}

Accounts.prototype.eth_sign = function (payload, cb) {
  let address = payload.params[0]
  let message = payload.params[1]

  let privateKey = this.accountsKeys[address]
  let account = web3.eth.accounts.privateKeyToAccount(privateKey)

  let data = account.sign(message)

  cb(null, data.signature)
}

module.exports = Accounts
