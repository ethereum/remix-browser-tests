export class Miner {
  vmContext

  constructor (vmContext) {
    this.vmContext = vmContext
  }

  methods () {
    return {
      miner_start: this.miner_start.bind(this),
      miner_stop: this.miner_stop.bind(this)
    }
  }

  miner_start (payload, cb) { cb() }

  miner_stop (payload, cb) { cb() }
}
