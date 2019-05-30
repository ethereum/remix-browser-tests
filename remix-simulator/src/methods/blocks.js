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
  var block = executionContext.blocks[payload.params[0]]

  let b = {
    'number': toHex(block.header.number),
    "hash": toHex(block.hash()),
    'parentHash': toHex(block.header.parentHash),
    'nonce': toHex(block.header.nonce),
    "sha3Uncles": "0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
    "logsBloom": "0xe670ec64341771606e55d6b4ca35a1a6b75ee3d5145a99d05921026d1527331",
    "transactionsRoot": "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
    "stateRoot": toHex(block.header.stateRoot),
    'miner': this.coinbase,
    'difficulty': toHex(block.header.difficulty),
    "totalDifficulty": toHex(block.header.totalDifficulty),
    'extraData': toHex(block.header.extraData),
    "size": "0x027f07", // 163591
    'gasLimit': toHex(block.header.gasLimit),
    'gasUsed': toHex(block.header.gasUsed),
    "timestamp": toHex(block.header.timestamp),
    // TODO: add transactions
    // block.transactions
    "transactions": [],
    "uncles": []
  }

  cb(null, b)
}

function toHex(value) {
  if (!value) return "0x0"
  let v = value.toString('hex')
  return ((v === "0x" || v === "") ? "0x0" : ("0x" + v))
}

Blocks.prototype.eth_getBlockByHash = function (payload, cb) {
  console.dir("eth_getBlockByHash")
  console.dir(payload)
  console.dir(Object.keys(executionContext.blocks))
  console.dir("== toJSON")
  console.dir(executionContext.blocks[payload.params[0]].toJSON())

  var block = executionContext.blocks[payload.params[0]]

  let b = {
    'number': toHex(block.header.number),
    "hash": toHex(block.hash()),
    'parentHash': toHex(block.header.parentHash),
    'nonce': toHex(block.header.nonce),
    "sha3Uncles": "0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
    "logsBloom": "0xe670ec64341771606e55d6b4ca35a1a6b75ee3d5145a99d05921026d1527331",
    "transactionsRoot": "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
    "stateRoot": toHex(block.header.stateRoot),
    'miner': this.coinbase,
    'difficulty': toHex(block.header.difficulty),
    "totalDifficulty": toHex(block.header.totalDifficulty),
    'extraData': toHex(block.header.extraData),
    "size": "0x027f07", // 163591
    'gasLimit': toHex(block.header.gasLimit),
    'gasUsed': toHex(block.header.gasUsed),
    "timestamp": toHex(block.header.timestamp),
    // TODO: add transactions
    // block.transactions
    "transactions": [],
    "uncles": []
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
