var Web3 = require('web3')
var RemixLib = require('remix-lib')
var executionContext = RemixLib.execution.executionContext

var Blocks = function (_options) {
  const options = _options || {}
  this.coinbase = options.coinbase || '0x0000000000000000000000000000000000000000'
  this.blockNumber = 0
}

Blocks.prototype.methods = function () {
  return {
    eth_getBlockByNumber: this.eth_getBlockByNumber.bind(this),
    eth_gasPrice: this.eth_gasPrice.bind(this),
    eth_coinbase: this.eth_coinbase.bind(this),
    eth_blockNumber: this.eth_blockNumber.bind(this),
    eth_getBlockByHash: this.eth_getBlockByHash.bind(this)
  }
}

Blocks.prototype.eth_getBlockByNumber = function (payload, cb) {
  let b = {
    'difficulty': '0x0',
    'extraData': '0x',
    'gasLimit': '0x7a1200',
    'gasUsed': '0x0',
    'hash': '0xdb731f3622ef37b4da8db36903de029220dba74c41185f8429f916058b86559f',
    'logsBloom': '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
    'miner': this.coinbase,
    'mixHash': '0x0000000000000000000000000000000000000000000000000000000000000000',
    'nonce': '0x0000000000000042',
    'number': Web3.utils.toHex(this.blockNumber),
    'parentHash': '0x0000000000000000000000000000000000000000000000000000000000000000',
    'receiptsRoot': '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
    'sha3Uncles': '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
    'size': '0x1f8',
    'stateRoot': '0xb7917653f92e62394d2207d0f39a1320ff1cb93d1cee80d3c492627e00b219ff',
    'timestamp': '0x0',
    'totalDifficulty': '0x0',
    'transactions': [],
    'transactionsRoot': '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
    'uncles': []
  }
  cb(null, b)
}

Blocks.prototype.eth_getBlockByHash = function (payload, cb) {
  console.dir("eth_getBlockByHash")
  console.dir(payload)
  console.dir(Object.keys(executionContext.blocks))
  console.dir("== toJSON")
  console.dir(executionContext.blocks[payload.params[0]].toJSON())

  let b = {
    'difficulty': '0x0',
    'extraData': '0x',
    'gasLimit': '0x7a1200',
    'gasUsed': '0x0',
    'hash': '0xdb731f3622ef37b4da8db36903de029220dba74c41185f8429f916058b86559f',
    'logsBloom': '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
    'miner': this.coinbase,
    'mixHash': '0x0000000000000000000000000000000000000000000000000000000000000000',
    'nonce': '0x0000000000000042',
    'number': Web3.utils.toHex(this.blockNumber),
    'parentHash': '0x0000000000000000000000000000000000000000000000000000000000000000',
    'receiptsRoot': '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
    'sha3Uncles': '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
    'size': '0x1f8',
    'stateRoot': '0xb7917653f92e62394d2207d0f39a1320ff1cb93d1cee80d3c492627e00b219ff',
    'timestamp': '0x0',
    'totalDifficulty': '0x0',
    'transactions': [],
    'transactionsRoot': '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
    'uncles': []
  }
  cb(null, b)
}

Blocks.prototype.eth_gasPrice = function (payload, cb) {
  cb(null, 1)
}

Blocks.prototype.eth_coinbase = function (payload, cb) {
  cb(null, this.coinbase)
}

Blocks.prototype.eth_blockNumber = function (payload, cb) {
  cb(null, this.blockNumber)
}

module.exports = Blocks
