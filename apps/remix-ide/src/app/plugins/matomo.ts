'use strict'
import { Plugin } from '@remixproject/engine'

const _paq = window._paq = window._paq || []

const profile = {
  name: 'matomo',
  description: 'send analytics to Matomo',
  methods: ['track'],
  events: [''],
  version: '1.0.0'
}

const allowedPlugins = ['LearnEth', 'etherscan', 'vyper', 'circuit-compiler', 'doc-gen', 'doc-viewer', 'solhint', 'walletconnect', 'scriptRunner', 'scriptRunnerBridge', 'dgit', 'contract-verification', 'noir-compiler']

export class Matomo extends Plugin {

  constructor() {
    super(profile)
  }

  async track(data: string[]) {
    if (!allowedPlugins.includes(this.currentRequest.from)) return
    _paq.push(data)
  }
}