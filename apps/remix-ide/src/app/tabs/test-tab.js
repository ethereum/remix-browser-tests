/* global */
import React from 'react' // eslint-disable-line
import { SolidityUnitTesting } from '@remix-ui/solidity-unit-testing' // eslint-disable-line
import { TestTabLogic } from '@remix-ui/solidity-unit-testing' // eslint-disable-line

import { ViewPlugin } from '@remixproject/engine-web'
import helper from '../../lib/helper'
import { canUseWorker, urlFromVersion } from '@remix-project/remix-solidity'
import { PluginViewWrapper } from '@remix-ui/helper'

var { UnitTestRunner, assertLibCode } = require('@remix-project/remix-tests')

const profile = {
  name: 'solidityUnitTesting',
  displayName: 'Solidity unit testing',
  methods: ['testFromPath', 'testFromSource', 'setTestFolderPath', 'getTestlibs', 'createTestLibs'],
  events: [],
  icon: 'assets/img/unitTesting.webp',
  description: 'Write and run unit tests for your contracts in Solidity',
  location: 'sidePanel',
  documentation: 'https://remix-ide.readthedocs.io/en/latest/unittesting.html',
  maintainedBy: 'Remix'
}

export default class TestTab extends ViewPlugin {
  constructor (fileManager, offsetToLineColumnConverter, filePanel, compileTab, appManager, contentImport) {
    super(profile)
    this.compileTab = compileTab
    this.contentImport = contentImport
    this.fileManager = fileManager
    this.filePanel = filePanel
    this.appManager = appManager
    this.testRunner = new UnitTestRunner()
    this.testTabLogic = new TestTabLogic(this.fileManager, helper)
    this.offsetToLineColumnConverter = offsetToLineColumnConverter
    this.allFilesInvolved = ['.deps/remix-tests/remix_tests.sol', '.deps/remix-tests/remix_accounts.sol']
    this.element = document.createElement('div')
    this.dispatch = null
  }

  onActivationInternal () {
    this.listenToEvents()
    this.call('filePanel', 'registerContextMenuItem', {
      id: 'solidityUnitTesting',
      name: 'setTestFolderPath',
      label: 'Set path for Unit Testing',
      type: ['folder'],
      extension: [],
      path: [],
      pattern: []
    })
  }

  async setTestFolderPath (event) {
    if (event.path.length > 0) {
      this.renderComponent(event.path[0])
    }
  }

  getTestlibs () {
    return { assertLibCode, accountsLibCode: this.testRunner.accountsLibCode }
  }

  async createTestLibs () {
    const provider = await this.fileManager.currentFileProvider()
    if (provider) {
      await provider.addExternal('.deps/remix-tests/remix_tests.sol', assertLibCode, 'remix_tests.sol')
      await provider.addExternal('.deps/remix-tests/remix_accounts.sol', this.testRunner.accountsLibCode, 'remix_accounts.sol')
    }
  }

  async onActivation () {
    const isSolidityActive = await this.call('manager', 'isActive', 'solidity')
    if (!isSolidityActive) {
      await this.call('manager', 'activatePlugin', 'solidity')
    }
    await this.testRunner.init(await this.call('blockchain', 'web3VM'))
    await this.createTestLibs()
  }

  onDeactivation () {
    this.off('filePanel', 'newTestFileCreated')
    this.off('filePanel', 'setWorkspace')
    this.off('filePanel', 'workspaceCreated')
    this.off('fileManager', 'currentFileChanged')
    // 'currentFileChanged' event is added more than once
  }

  listenToEvents () {
    this.on('filePanel', 'workspaceCreated', async () => {
      setTimeout(() => this.createTestLibs(), 50)
    })

    this.testRunner.event.on('compilationFinished', (success, data, source, input, version) => {
      if (success) {
        this.allFilesInvolved.push(...Object.keys(data.sources))
        // forwarding the event to the appManager infra
        // This is listened by compilerArtefacts to show data while debugging
        this.emit('compilationFinished', source.target, source, 'soljson', data, input, version)
      }
    })
  }

  async testFromPath (path) {
    const fileContent = await this.fileManager.readFile(path)
    return this.testFromSource(fileContent, path)
  }

  /*
    Test is not associated with the UI
  */
  async testFromSource (content, path = 'browser/unit_test.sol') {
    const web3 = await this.call('blockchain', 'web3VM')
    await this.testRunner.init(web3)
    await this.createTestLibs()
    return new Promise((resolve, reject) => {
      const runningTest = {}
      runningTest[path] = { content }
      const { currentVersion, evmVersion, optimize, runs } = this.compileTab.getCurrentCompilerConfig()
      const currentCompilerUrl = urlFromVersion(currentVersion)
      const compilerConfig = {
        currentCompilerUrl,
        evmVersion,
        optimize,
        usingWorker: canUseWorker(currentVersion),
        runs
      }
      this.testRunner.runTestSources(runningTest, compilerConfig, () => { /* Do nothing. */ }, () => { /* Do nothing. */ }, null, (error, result) => {
        if (error) return reject(error)
        resolve(result)
      }, (url, cb) => {
        return this.contentImport.resolveAndSave(url).then((result) => cb(null, result)).catch((error) => cb(error.message))
      }, {})
    })
  }

  setDispatch (dispatch) {
    this.dispatch = dispatch
    this.renderComponent('tests')
  }

  render () {
    this.onActivationInternal()
    return <div><PluginViewWrapper plugin={this} /></div>
  }

  updateComponent(state) {
    return <SolidityUnitTesting testTab={state.testTab} helper={state.helper} initialPath={state.testDirPath} />
  }

  renderComponent (testDirPath) {
    this.dispatch({
      testTab: this,
      helper: helper,
      testDirPath: testDirPath
    })
  }
}
