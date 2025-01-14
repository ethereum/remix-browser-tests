/* eslint-disable prefer-const */
import React from 'react'
import { Plugin } from '@remixproject/engine'
import { ElectronPlugin } from '@remixproject/engine-electron'

const _paq = (window._paq = window._paq || [])

const profile = {
  name: 'desktopHost',
  displayName: '',
  description: '',
  methods: [],
  events: ['connected'],
  maintainedBy: 'Remix'
}

export class DesktopHost extends ElectronPlugin {

  constructor() {
    super(profile)
  }

  onActivation() {
    console.log('DesktopHost activated')
    _paq.push(['trackEvent', 'plugin', 'activated', 'DesktopHost'])
  }

}