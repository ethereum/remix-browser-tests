import Web3 from 'web3'
const version = require('../../package.json').version

export function methods () {
  return {
    web3_clientVersion: this.web3_clientVersion.bind(this),
    eth_protocolVersion: this.eth_protocolVersion.bind(this),
    eth_syncing: this.eth_syncing.bind(this),
    eth_mining: this.eth_mining.bind(this),
    eth_hashrate: this.eth_hashrate.bind(this),
    web3_sha3: this.web3_sha3.bind(this),
    eth_getCompilers: this.eth_getCompilers.bind(this),
    eth_compileSolidity: this.eth_compileSolidity.bind(this),
    eth_compileLLL: this.eth_compileLLL.bind(this),
    eth_compileSerpent: this.eth_compileSerpent.bind(this)
  }
}

export function web3_clientVersion (payload, cb) {
  cb(null, 'Remix Simulator/' + version)
}

export function eth_protocolVersion (payload, cb) {
  cb(null, '0x3f')
}

export function eth_syncing (payload, cb) {
  cb(null, false)
}

export function eth_mining (payload, cb) {
  // TODO: should depend on the state
  cb(null, false)
}

export function eth_hashrate (payload, cb) {
  cb(null, '0x0')
}

export function web3_sha3 (payload, cb) {
  const str: string = payload.params[0]
  cb(null, Web3.utils.sha3(str))
}

export function eth_getCompilers (payload, cb) {
  cb(null, [])
}

export function eth_compileSolidity (payload, cb) {
  cb(null, 'unsupported')
}

export function eth_compileLLL (payload, cb) {
  cb(null, 'unsupported')
}

export function eth_compileSerpent (payload, cb) {
  cb(null, 'unsupported')
}
