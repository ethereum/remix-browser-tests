'use strict'
import { NightwatchBrowser } from 'nightwatch'
import init from '../helpers/init'

module.exports = {
  before: function (browser: NightwatchBrowser, done: VoidFunction) {
    init(browser, done)
  },

  '@sources': function () {
    return sources
  },

  'Test Simple Contract': function (browser: NightwatchBrowser) {
    browser.testContracts('Untitled.sol', sources[0]['Untitled.sol'], ['test1', 'test2'])
  },

  'Test Success Import': function (browser: NightwatchBrowser) {
    browser.addFile('Untitled1.sol', sources[1]['Untitled1.sol'])
      .addFile('Untitled2.sol', sources[1]['Untitled2.sol'])
      .openFile('Untitled1.sol')
      .verifyContracts(['test6', 'test4', 'test5'])
      .pause(1000)
  },

  'Test Failed Import': function (browser: NightwatchBrowser) {
    browser.addFile('Untitled3.sol', sources[2]['Untitled3.sol'])
      .clickLaunchIcon('solidity')
      .assert.containsText('#compileTabView .error pre', 'not found Untitled11.sol')
  },

  'Test Github Import - from master branch': function (browser: NightwatchBrowser) {
    browser
      .setSolidityCompilerVersion('soljson-v0.8.0+commit.c7dfd78e.js') // open-zeppelin moved to pragma ^0.8.0 (master branch)
      .addFile('Untitled4.sol', sources[3]['Untitled4.sol'])
      .clickLaunchIcon('filePanel')
      .verifyContracts(['test7', 'ERC20'], { wait: 10000 })
  },

  'Test Github Import - from other branch': function (browser: NightwatchBrowser) {
    browser
      .setSolidityCompilerVersion('soljson-v0.5.0+commit.1d4f565a.js') // switch back to 0.5.0 : release-v2.3.0 branch is not solidity 0.6 compliant
      .addFile('Untitled5.sol', sources[4]['Untitled5.sol'])
      .clickLaunchIcon('filePanel')
      .verifyContracts(['test8', 'ERC20', 'SafeMath'], { wait: 10000 })
  },

  'Test Github Import - no branch specified': function (browser: NightwatchBrowser) {
    browser
      .setSolidityCompilerVersion('soljson-v0.8.0+commit.c7dfd78e.js') // open-zeppelin moved to pragma ^0.8.0 (master branch)
      .clickLaunchIcon('filePanel')
      .click('li[data-id="treeViewLitreeViewItemREADME.txt"')
      .addFile('Untitled6.sol', sources[5]['Untitled6.sol'])
      .clickLaunchIcon('filePanel')
      .verifyContracts(['test10', 'ERC20'], { wait: 10000 })
  },

  'Test Github Import - raw URL': function (browser: NightwatchBrowser) {
    browser
      .clickLaunchIcon('filePanel')
      .click('li[data-id="treeViewLitreeViewItemREADME.txt"')
      .addFile('Untitled7.sol', sources[6]['Untitled7.sol'])
      .clickLaunchIcon('filePanel')
      .verifyContracts(['test11', 'ERC20'], { wait: 10000 })
  },

  'Test switch to a github import from a solidity warning': function (browser: NightwatchBrowser) {
    browser
      .setSolidityCompilerVersion('soljson-v0.7.4+commit.3f05b770.js')
      .clickLaunchIcon('filePanel')
      .click('li[data-id="treeViewLitreeViewItemREADME.txt"')
      .addFile('Untitled8.sol', sources[7]['Untitled8.sol'])
      .clickLaunchIcon('filePanel')
      .clickLaunchIcon('solidity')
      .waitForElementVisible('[data-id="https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/master/contracts/token/ERC20/ERC20.sol"]', 120000)
      .scrollAndClick('[data-id="https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/master/contracts/token/ERC20/ERC20.sol"]') // click on error which point to ERC20 code
      .pause(5000)
      .waitForElementContainsText('#input', 'contract ERC20 is Context, IERC20', 60000)
  },

  'Test NPM Import (with unpkg.com)': function (browser: NightwatchBrowser) {
    browser
      .setSolidityCompilerVersion('soljson-v0.8.7+commit.e28d00a7.js')
      .clickLaunchIcon('filePanel')
      .click('li[data-id="treeViewLitreeViewItemREADME.txt"')
      .addFile('Untitled9.sol', sources[8]['Untitled9.sol'])
      .clickLaunchIcon('filePanel')
      .verifyContracts(['test13', 'ERC20'], { wait: 30000 })
      .end()
  }
}

const sources = [
  {
    'Untitled.sol': { content: 'contract test1 {} contract test2 {}' }
  },
  {
    'Untitled1.sol': { content: 'import "./Untitled2.sol"; contract test6 {}' },
    'Untitled2.sol': { content: 'contract test4 {} contract test5 {}' }
  },
  {
    'Untitled3.sol': { content: 'import "./Untitled11.sol"; contract test6 {}' }
  },
  {
    'Untitled4.sol': { content: 'import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol"; contract test7 {}' }
  },
  {
    'Untitled5.sol': { content: 'import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/release-v2.3.0/contracts/token/ERC20/ERC20.sol"; contract test8 {}' }
  },
  {
    'Untitled6.sol': { content: 'import "https://github.com/OpenZeppelin/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol"; contract test10 {}' }
  },
  {
    'Untitled7.sol': { content: 'import "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/master/contracts/token/ERC20/ERC20.sol"; contract test11 {}' }
  },
  {
    'Untitled8.sol': { content: 'import "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/master/contracts/token/ERC20/ERC20.sol"; contract test12 {}' }
  },
  {
    'Untitled9.sol': { content: 'pragma solidity ^0.8.0; import "@openzeppelin/contracts/token/ERC20/ERC20.sol"; contract test13 {}' }
  }
]
