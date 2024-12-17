'use strict'
import { NightwatchBrowser } from 'nightwatch'
import init from '../helpers/init'
import examples from '../examples/example-contracts'

const passphrase = process.env.account_passphrase
const password = process.env.account_password
const extension_id = 'nkbihfbeogaeaoehlefnkodbefgpgknn'
const extension_url = `chrome-extension://${extension_id}/home.html`

const checkBrowserIsChrome = function (browser: NightwatchBrowser) {
  return browser.browserName.indexOf('chrome') > -1
}

const checkAlerts = function (browser: NightwatchBrowser) {
  browser.isVisible({
    selector: '//*[contains(.,"not have enough")]',
    locateStrategy: 'xpath',
    suppressNotFoundErrors: true,
    timeout: 3000
  }, (okVisible) => {
    if (okVisible.value) {
      browser.assert.fail('Not enough ETH in test account!!')
      browser.end()
    }
  })
}

const localsCheck = {
  to: {
    value: '0x4B0897B0513FDC7C541B6D9D7E929C4E5364D2DB',
    type: 'address'
  }
}

const tests = {
  '@disabled': true,
  before: function (browser: NightwatchBrowser, done: VoidFunction) {
    init(browser, done)
  },

  '@sources': function () {
    return sources
  },

  'Should connect to Sepolia Test Network using MetaMask #group1': function (browser: NightwatchBrowser) {
    browser.waitForElementPresent('*[data-id="remixIdeSidePanel"]')
      .setupMetamask(passphrase, password)
      .useCss()
      .switchBrowserTab(0)
      .refreshPage()
      .waitForElementVisible('*[data-id="remixIdeIconPanel"]', 10000)
      .click('*[data-id="landingPageStartSolidity"]')
      .clickLaunchIcon('udapp')
      .switchEnvironment('injected-MetaMask')
      .pause(5000)
      .switchBrowserWindow(extension_url, 'MetaMask', (browser) => {
        browser
          .hideMetaMaskPopup()
          .waitForElementVisible('*[data-testid="page-container-footer-next"]', 60000)
          .click('*[data-testid="page-container-footer-next"]') // this connects the metamask account to remix
          .pause(2000)
          .waitForElementVisible('*[data-testid="page-container-footer-next"]', 60000)
          .click('*[data-testid="page-container-footer-next"]')
      })
      .switchBrowserTab(0) // back to remix
      .waitForElementPresent('*[data-id="settingsNetworkEnv"]')
      .assert.containsText('*[data-id="settingsNetworkEnv"]', 'Sepolia (11155111) network')
  },

  'Should add a contract file #group1': function (browser: NightwatchBrowser) {
    browser.waitForElementVisible('*[data-id="remixIdeSidePanel"]')
      .clickLaunchIcon('filePanel')
      .addFile('Greet.sol', sources[0]['Greet.sol'])
      .clickLaunchIcon('udapp')
      .waitForElementVisible('*[data-id="Deploy - transact (not payable)"]', 45000) // wait for the contract to compile
  },

  'Should deploy contract on Sepolia Test Network using MetaMask #group1': function (browser: NightwatchBrowser) {
    browser.clearConsole().waitForElementPresent('*[data-id="runTabSelectAccount"] option', 45000)
      .clickLaunchIcon('filePanel')
      .openFile('Greet.sol')
      .clickLaunchIcon('udapp')
      .waitForElementPresent('*[data-id="Deploy - transact (not payable)"]')
      .click('*[data-id="Deploy - transact (not payable)"]')
      .pause(5000)
      .clearConsole()
      .perform((done) => {
        browser.switchBrowserWindow(extension_url, 'MetaMask', (browser) => {
          checkAlerts(browser)
          browser
            .maximizeWindow()
            .hideMetaMaskPopup()
            .waitForElementPresent('[data-testid="page-container-footer-next"]')
            .click('[data-testid="page-container-footer-next"]') // approve the tx
            .switchBrowserTab(0) // back to remix
            .waitForElementContainsText('*[data-id="terminalJournal"]', 'view on etherscan', 60000)
            .waitForElementContainsText('*[data-id="terminalJournal"]', 'from: 0x76a...2708f', 60000)
            .perform(() => done())
        })
      })
  },
  'Should run low level interaction (fallback function) on Sepolia Test Network using MetaMask #group1': function (browser: NightwatchBrowser) {
    browser.clearConsole().waitForElementPresent('*[data-id="remixIdeSidePanel"]')
      .clickInstance(0)
      .clearConsole()
      .waitForElementPresent('*[data-id="pluginManagerSettingsDeployAndRunLLTxSendTransaction"]')
      .click('*[data-id="pluginManagerSettingsDeployAndRunLLTxSendTransaction"]')
      .perform((done) => {
        browser.switchBrowserWindow(extension_url, 'MetaMask', (browser) => {
          browser
            .maximizeWindow()
            .hideMetaMaskPopup()
            .pause(3000)
            .scrollAndClick('[data-testid="page-container-footer-next"]')
            .pause(2000)
            .switchBrowserTab(0) // back to remix
            .waitForElementVisible({
              locateStrategy: 'xpath',
              selector: "//span[@class='text-log' and contains(., 'transact to HelloWorld.(fallback) pending')]"
            })
            .waitForElementContainsText('*[data-id="terminalJournal"]', 'view on etherscan', 60000)
            .waitForElementContainsText('*[data-id="terminalJournal"]', 'from: 0x76a...2708f', 60000)
            .perform(() => done())
        })
      })
  },
  'Should run transaction (greet function) on Sepolia Test Network using MetaMask #group1': function (browser: NightwatchBrowser) {
    browser.clearConsole().waitForElementPresent('*[data-id="remixIdeSidePanel"]')
      .clearConsole()
      .waitForElementPresent('*[data-title="string _message"]')
      .setValue('*[data-title="string _message"]', 'test')
      .waitForElementVisible('*[data-id="greet - transact (not payable)"]')
      .click('*[data-id="greet - transact (not payable)"]')
      .perform((done) => {
        browser.switchBrowserWindow(extension_url, 'MetaMask', (browser) => {
          browser
            .maximizeWindow()
            .hideMetaMaskPopup()
            .pause(3000)
            .scrollAndClick('[data-testid="page-container-footer-next"]')
            .pause(2000)
            .switchBrowserTab(0) // back to remix
            .waitForElementVisible({
              locateStrategy: 'xpath',
              selector: "//span[@class='text-log' and contains(., 'transact to HelloWorld.greet pending')]"
            })
            .waitForElementContainsText('*[data-id="terminalJournal"]', 'view on etherscan', 60000)
            .waitForElementContainsText('*[data-id="terminalJournal"]', 'from: 0x76a...2708f', 60000)
            .perform(() => done())
        })
      })
  },

  'Should deploy faulty contract on Sepolia Test Network using MetaMask and show error in terminal #group1': function (browser: NightwatchBrowser) {
    browser
      .clearConsole()
      .clickLaunchIcon('filePanel')
      .addFile('faulty.sol', sources[0]['faulty.sol'])
      .clickLaunchIcon('udapp')
      .waitForElementPresent('*[data-id="Deploy - transact (not payable)"]')
      .click('*[data-id="Deploy - transact (not payable)"]')
      .pause(5000)
      .waitForElementVisible('*[data-id="udappNotifyModalDialogModalBody-react"]', 60000)
      .click('[data-id="udappNotify-modal-footer-cancel-react"]')
      .waitForElementVisible({
        locateStrategy: 'xpath',
        selector: "//span[@class='text-log' and contains(., 'errored')]"
      })
  },
  'Should deploy contract on Sepolia Test Network using MetaMask again #group1': function (browser: NightwatchBrowser) {
    browser.clearConsole().waitForElementPresent('*[data-id="runTabSelectAccount"] option', 45000)
      .clickLaunchIcon('filePanel')
      .openFile('Greet.sol')
      .clickLaunchIcon('udapp')
      .waitForElementPresent('*[data-id="Deploy - transact (not payable)"]')
      .click('*[data-id="Deploy - transact (not payable)"]')
      .pause(5000)
      .clearConsole()
      .perform((done) => {
        browser.switchBrowserWindow(extension_url, 'MetaMask', (browser) => {
          checkAlerts(browser)
          browser
            .maximizeWindow()
            .hideMetaMaskPopup()
            .waitForElementPresent('[data-testid="page-container-footer-next"]')
            .click('[data-testid="page-container-footer-next"]') // approve the tx
            .switchBrowserTab(0) // back to remix
            .waitForElementContainsText('*[data-id="terminalJournal"]', 'view on etherscan', 60000)
            .waitForElementContainsText('*[data-id="terminalJournal"]', 'from: 0x76a...2708f', 60000)
            .perform(() => done())
        })
      })
  },

  // main network tests
  'Should connect to Ethereum Main Network using MetaMask #group1': function (browser: NightwatchBrowser) {
    browser.waitForElementPresent('*[data-id="remixIdeSidePanel"]')
      .switchBrowserTab(1)
      .click('[data-testid="network-display"]')
      .click('div[data-testid="Ethereum Mainnet"]') // switch to mainnet
      .useCss().switchBrowserTab(0)
      .refreshPage()
      .waitForElementVisible('*[data-id="remixIdeIconPanel"]', 10000)
      .click('*[data-id="landingPageStartSolidity"]')
      .clickLaunchIcon('udapp')
      .switchEnvironment('injected-MetaMask')
      .waitForElementPresent('*[data-id="settingsNetworkEnv"]')
      .assert.containsText('*[data-id="settingsNetworkEnv"]', 'Main (1) network')
  },

  'Should deploy contract on Ethereum Main Network using MetaMask #group1': function (browser: NightwatchBrowser) {
    browser.waitForElementPresent('*[data-id="runTabSelectAccount"] option')
      .clickLaunchIcon('filePanel')
      .addFile('Greet.sol', sources[0]['Greet.sol'])
      .clickLaunchIcon('udapp')
      .waitForElementPresent('*[data-id="Deploy - transact (not payable)"]')
      .click('*[data-id="Deploy - transact (not payable)"]')
      .waitForElementVisible('*[data-id="udappNotifyModalDialogModalBody-react"]', 65000)
      .modalFooterOKClick('udappNotify')
      .pause(10000)
      .assert.containsText('*[data-id="udappNotifyModalDialogModalBody-react"]', 'You are about to create a transaction on Main Network. Confirm the details to send the info to your provider.')
      .modalFooterCancelClick('udappNotify')
  },
  // debug transaction
  'Should deploy Ballot to Sepolia using metamask #group1': function (browser: NightwatchBrowser) {
    browser.waitForElementPresent('*[data-id="remixIdeSidePanel"]')
      .switchBrowserTab(1)
      .click('[data-testid="network-display"]')
      .click('div[data-testid="Sepolia"]') // switch to sepolia
      .useCss().switchBrowserTab(0)
      .addFile('BallotTest.sol', examples.ballot)
      .clickLaunchIcon('udapp')
      .clearConsole()
      .clearTransactions()
      .clickLaunchIcon('udapp')
      .waitForElementVisible('input[placeholder="bytes32[] proposalNames"]')
      .pause(2000)
      .setValue('input[placeholder="bytes32[] proposalNames"]', '["0x48656c6c6f20576f726c64210000000000000000000000000000000000000000"]')
      .pause(1000)
      .click('*[data-id="Deploy - transact (not payable)"]') // deploy ballot
      .pause(1000)
      .waitForElementVisible({
        locateStrategy: 'xpath',
        selector: "//span[@class='text-log' and contains(., 'creation of')]"
      })
      .waitForElementVisible({
        locateStrategy: 'xpath',
        selector: "//span[@class='text-log' and contains(., 'pending')]"
      })
      .perform((done) => {
        browser.switchBrowserWindow(extension_url, 'MetaMask', (browser) => {
          browser
            .maximizeWindow()
            .hideMetaMaskPopup()
            .pause(3000)
            .waitForElementPresent('[data-testid="page-container-footer-next"]')
            .scrollAndClick('[data-testid="page-container-footer-next"]')
            .pause(2000)
            .switchBrowserTab(0) // back to remix
            .waitForElementContainsText('*[data-id="terminalJournal"]', 'view on etherscan', 60000)
            .waitForElementContainsText('*[data-id="terminalJournal"]', 'from: 0x76a...2708f', 60000)
            .perform(() => done())
        })
      })
    },

    'do transaction #group1': function (browser: NightwatchBrowser) {
      browser.waitForElementPresent('*[data-id="universalDappUiContractActionWrapper"]', 60000)
      .clearConsole()
      .clickInstance(0)
      .clickFunction('delegate - transact (not payable)', { types: 'address to', values: '"0x4b0897b0513fdc7c541b6d9d7e929c4e5364d2db"' })
      .pause(5000)
      .perform((done) => { // call delegate
        browser.switchBrowserWindow(extension_url, 'MetaMask', (browser) => {
          browser
            .maximizeWindow()
            .hideMetaMaskPopup()
            .pause(5000)
            .waitForElementPresent('[data-testid="page-container-footer-next"]')
            .scrollAndClick('[data-testid="page-container-footer-next"]')
            .pause(2000)
            .switchBrowserTab(0) // back to remix
            .waitForElementContainsText('*[data-id="terminalJournal"]', 'view on etherscan', 60000)
            .waitForElementContainsText('*[data-id="terminalJournal"]', 'from: 0x76a...2708f', 60000)
            .perform(() => done())
        })
      })
      .testFunction('last',
        {
          status: '0x1 Transaction mined and execution succeed',
          'decoded input': { 'address to': '0x4B0897b0513fdC7C541B6d9D7E929C4e5364D2dB' }
        })
  },
  'Should debug Sepolia transaction with source highlighting MetaMask #group1': function (browser: NightwatchBrowser) {
    let txhash
    browser.waitForElementVisible('*[data-id="remixIdeIconPanel"]', 10000)
      .clickLaunchIcon('pluginManager') // load debugger and source verification
      .clickLaunchIcon('udapp')
      .perform((done) => {
        browser.getLastTransactionHash((hash) => {
          txhash = hash
          done()
        })
      })
      .pause(5000)
      .perform((done) => {
        browser
          .waitForElementVisible('*[data-id="remixIdeIconPanel"]', 10000)
          .clickLaunchIcon('debugger')
          .waitForElementVisible('*[data-id="debuggerTransactionInput"]')
          .setValue('*[data-id="debuggerTransactionInput"]', txhash) // debug tx
          .pause(2000)
          .click('*[data-id="debuggerTransactionStartButton"]')
          .waitForElementVisible('*[data-id="treeViewDivto"]', 30000)
          .checkVariableDebug('soliditylocals', localsCheck)
          .perform(() => done())
      })

  },
  'Call web3.eth.getAccounts() using Injected Provider (Metamask) #group1': function (browser: NightwatchBrowser) {
    if (!checkBrowserIsChrome(browser)) return
    browser
      .executeScriptInTerminal('web3.eth.getAccounts()')
      .journalLastChildIncludes('["0x76a3ABb5a12dcd603B52Ed22195dED17ee82708f"]')
  },
  // EIP 712 tests
  'Test EIP 712 Signature with Injected Provider (Metamask) #group1': function (browser: NightwatchBrowser) {
    browser
      .clickLaunchIcon('udapp')
      .waitForElementPresent('i[id="remixRunSignMsg"]')
      .click('i[id="remixRunSignMsg"]')
      .waitForElementVisible('*[data-id="signMessageTextarea"]', 120000)
      .click('*[data-id="sign-eip-712"]')
      .waitForElementVisible('*[data-id="udappNotify-modal-footer-ok-react"]')
      .modalFooterOKClick('udappNotify')
      .pause(1000)
      .getEditorValue((content) => {
        browser.assert.ok(content.indexOf('"primaryType": "AuthRequest",') !== -1, 'EIP 712 data file must be opened')
      })
      .setEditorValue(JSON.stringify(EIP712_Example, null, '\t'))
      .pause(5000)
      .clickLaunchIcon('filePanel')
      .rightClick('li[data-id="treeViewLitreeViewItemEIP-712-data.json"]')
      .click('*[data-id="contextMenuItemsignTypedData"]')
      .pause(1000)
      .perform((done) => { // call delegate
        browser.switchBrowserWindow(extension_url, 'MetaMask', (browser) => {
          browser
            .maximizeWindow()
            .hideMetaMaskPopup()
            .pause(1000)
            .waitForElementPresent('[data-testid="page-container-footer-next"]')
            .scrollAndClick('button[data-testid="page-container-footer-next"]') // confirm
            .switchBrowserTab(0) // back to remix
            .perform(() => done())
        })
      })
      .pause(1000)
      .journalChildIncludes('0xec72bbabeb47a3a766af449674a45a91a6e94e35ebf0ae3c644b66def7bd387f1c0b34d970c9f4a1e9398535e5860b35e82b2a8931b7c9046b7766a53e66db3d1b')
  }
}

const branch = process.env.CIRCLE_BRANCH
const runTestsConditions = branch && (branch === 'master' || branch === 'remix_live' || branch.includes('remix_beta') || branch.includes('metamask'))

if (!checkBrowserIsChrome(browser)) {
  module.exports = {}
} else {
  module.exports = {
    ...(branch ? (runTestsConditions ? tests : {}) : tests)
  };
}


const EIP712_Example = {
  domain: {
    chainId: 11155111,
    name: "Example App",
    verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
    version: "1",
  },
  message: {
    prompt: "Welcome! In order to authenticate to this website, sign this request and your public address will be sent to the server in a verifiable way.",
    createdAt: 1718570375196,
  },
  primaryType: 'AuthRequest',
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
    AuthRequest: [
      { name: 'prompt', type: 'string' },
      { name: 'createdAt', type: 'uint256' },
    ],
  },
}


const sources = [
  {
    'Greet.sol': {
      content:
        `
      pragma solidity ^0.8.0;
      contract HelloWorld {
          string public message;
          
          fallback () external {
              message = 'Hello World!';
          }
          
          function greet(string memory _message) public {
              message = _message;
          }
      }`
    },
    'faulty.sol': {
      content: `// SPDX-License-Identifier: GPL-3.0

      pragma solidity >=0.8.2 <0.9.0;

      contract Test {
          error O_o(uint256);
          constructor() {
              revert O_o(block.timestamp);
          }
      }`
    }
  }
]
