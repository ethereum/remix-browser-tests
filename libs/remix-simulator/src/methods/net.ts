export class Net {
  vmContext
  options

  constructor (vmContext, options) {
    this.vmContext = vmContext
    this.options = options
  }

  methods () {
    return {
      net_version: this.net_version.bind(this),
      net_listening: this.net_listening.bind(this),
      net_peerCount: this.net_peerCount.bind(this)
    }
  }

  net_version (payload, cb) { cb(null, 1337) }

  net_listening (payload, cb) { cb(null, true)}

  net_peerCount (payload, cb) { cb(null, 0)}
}

