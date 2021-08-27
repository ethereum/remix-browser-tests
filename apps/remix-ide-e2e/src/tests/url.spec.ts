'use strict'

import { NightwatchBrowser } from 'nightwatch'
import init from '../helpers/init'
import examples from '../examples/example-contracts'

const sources = [
  { 'Untitled.sol': { content: examples.ballot.content } }
]

module.exports = {
  before: function (browser: NightwatchBrowser, done: VoidFunction) {
    init(browser, done, 'http://127.0.0.1:8080/#optimize=true&runs=300&evmVersion=istanbul&version=soljson-v0.7.4+commit.3f05b770.js', true)
  },

  '@sources': function () {
    return sources
  },

  'Should load the code from URL params (code param)': function (browser: NightwatchBrowser) {
    browser
      .pause(5000)
      .url('http://127.0.0.1:8080/#optimize=true&runs=300&evmVersion=istanbul&version=soljson-v0.7.4+commit.3f05b770.js&code=cHJhZ21hIHNvbGlkaXR5ID49MC42LjAgPDAuNy4wOwoKaW1wb3J0ICJodHRwczovL2dpdGh1Yi5jb20vT3BlblplcHBlbGluL29wZW56ZXBwZWxpbi1jb250cmFjdHMvYmxvYi9tYXN0ZXIvY29udHJhY3RzL2FjY2Vzcy9Pd25hYmxlLnNvbCI7Cgpjb250cmFjdCBHZXRQYWlkIGlzIE93bmFibGUgewogIGZ1bmN0aW9uIHdpdGhkcmF3KCkgZXh0ZXJuYWwgb25seU93bmVyIHsKICB9Cn0')
      .refresh() // we do one reload for making sure we already have the default workspace
      .pause(5000)
      .currentWorkspaceIs('code-sample')
      .getEditorValue((content) => {
        browser.assert.ok(content.indexOf(
          'https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol') !== -1,
        'code has not been loaded')
      })
  },

  'Should load the code from URL params (url param)': function (browser: NightwatchBrowser) {
    browser
      .pause(5000)
      .url('http://127.0.0.1:8080/#optimize=true&runs=300&evmVersion=istanbul&version=soljson-v0.7.4+commit.3f05b770.js&url=https://github.com/ethereum/remix-project/blob/master/apps/remix-ide/contracts/app/solidity/mode.sol')
      .refresh() // we do one reload for making sure we already have the default workspace
      .pause(5000)
      .currentWorkspaceIs('code-sample')
      .getEditorValue((content) => {
        browser.assert.ok(content.indexOf(
          'proposals.length = _numProposals;') !== -1,
        'url has not been loaded')
      })
  },

  'Should load the code from URL & code params': function (browser: NightwatchBrowser) {
    browser
      .pause(5000)
      .url('http://127.0.0.1:8080/#optimize=true&runs=300&evmVersion=istanbul&version=soljson-v0.7.4+commit.3f05b770.js&url=https://github.com/ethereum/remix-project/blob/master/apps/remix-ide/contracts/app/solidity/mode.sol&code=cHJhZ21hIHNvbGlkaXR5ID49MC42LjAgPDAuNy4wOwoKaW1wb3J0ICJodHRwczovL2dpdGh1Yi5jb20vT3BlblplcHBlbGluL29wZW56ZXBwZWxpbi1jb250cmFjdHMvYmxvYi9tYXN0ZXIvY29udHJhY3RzL2FjY2Vzcy9Pd25hYmxlLnNvbCI7Cgpjb250cmFjdCBHZXRQYWlkIGlzIE93bmFibGUgewogIGZ1bmN0aW9uIHdpdGhkcmF3KCkgZXh0ZXJuYWwgb25seU93bmVyIHsKICB9Cn0')
      .refresh() // we do one reload for making sure we already have the default workspace
      .pause(5000)
      .currentWorkspaceIs('code-sample')
      .getEditorValue((content) => {
        browser.assert.ok(content.indexOf(
          'proposals.length = _numProposals;') !== -1,
        'code has not been loaded')
      })
      .openFile('contract-76747f6e19.sol')
      .openFile('ethereum')
      .openFile('ethereum/remix-project')
      .openFile('ethereum/remix-project/apps')
      .openFile('ethereum/remix-project/apps/remix-ide')
      .openFile('ethereum/remix-project/apps/remix-ide/contracts')
      .openFile('ethereum/remix-project/apps/remix-ide/contracts/app')
      .openFile('ethereum/remix-project/apps/remix-ide/contracts/app/solidity')
      .openFile('ethereum/remix-project/apps/remix-ide/contracts/app/solidity/mode.sol')
  },

  'Should load using URL compiler params': function (browser: NightwatchBrowser) {
    browser
      .pause(5000)
      .url('http://127.0.0.1:8080/#optimize=true&runs=300&autoCompile=true&evmVersion=istanbul&version=soljson-v0.7.4+commit.3f05b770.js&language=Yul')
      .refresh()
      .pause(5000)
      .clickLaunchIcon('solidity')
      .assert.containsText('#versionSelector option[data-id="selected"]', '0.7.4+commit.3f05b770')
      .assert.containsText('#evmVersionSelector option[data-id="selected"]', 'istanbul')
      .assert.containsText('#compilierLanguageSelector option[data-id="selected"]', 'Yul')
      .verify.elementPresent('#optimize:checked')
      .verify.elementPresent('#autoCompile:checked')
      .verify.attributeEquals('#runs', 'value', '300')
  },

  'Should load using compiler from link passed in remix URL': function (browser: NightwatchBrowser) {
    browser
      .url('http://127.0.0.1:8080/#version=https://solidity-blog.s3.eu-central-1.amazonaws.com/data/08preview/soljson.js&optimize=false')
      .refresh()
      .pause(5000)
      .clickLaunchIcon('solidity')
      .pause(5000)
      .assert.containsText('#versionSelector option[data-id="selected"]', 'custom')
    // default values
      .assert.containsText('#evmVersionSelector option[data-id="selected"]', 'default')
      .verify.elementPresent('#optimize')
      .assert.elementNotPresent('#optimize:checked')
      .verify.elementPresent('#runs:disabled')
      .click('[for="optimize"')
      .verify.attributeEquals('#runs', 'value', '200')
      .end()
  }
}
