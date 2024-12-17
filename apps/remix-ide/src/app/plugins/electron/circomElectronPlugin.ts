import { ElectronPlugin } from '@remixproject/engine-electron'

export class circomPlugin extends ElectronPlugin {
  constructor() {
    super({
      displayName: 'circom',
      name: 'circom',
      description: 'circom language compiler',
    })
    this.methods = []
  }
}
