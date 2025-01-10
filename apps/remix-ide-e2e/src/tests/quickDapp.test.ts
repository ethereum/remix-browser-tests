'use strict'
import { NightwatchBrowser } from 'nightwatch'
import path from 'path'
import axios from 'axios'
import crypto from 'crypto'
import init from '../helpers/init'

const passphrase = process.env.account_passphrase
const password = process.env.account_password
const extension_id = 'nkbihfbeogaeaoehlefnkodbefgpgknn'
const extension_url = `chrome-extension://${extension_id}/home.html`
const address = '0x3b3f6501A7fE68d22eFbc07d4424D4b9115C3038'
const surgeEmail = 'e2e@remix.org'
const surgePassword = 'remixe2e'
const surgeSubdomain = 'remixe2e'
const logoFilePath = path.resolve(__dirname, '../../../remix-ide/assets/img/remixLogo.webp')
const logoHash = 'ba8db45b3af49365bd482c7037dacaf1c549dc73c070ad963922adfeece4f37d'

const checkBrowserIsChrome = function (browser: NightwatchBrowser) {
  return browser.browserName.indexOf('chrome') > -1
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
    if (!checkBrowserIsChrome(browser)) return
    browser.waitForElementPresent('*[data-id="remixIdeSidePanel"]')
      .setupMetamask(passphrase, password)
      .useCss().switchBrowserTab(0)
      .refreshPage()
      .waitForElementVisible('*[data-id="remixIdeIconPanel"]', 10000)
      .click('*[data-id="landingPageStartSolidity"]')
      .clickLaunchIcon('udapp')
      .switchEnvironment('injected-MetaMask')

      .pause(5000)
      .switchBrowserWindow(extension_url, 'MetaMask', (browser) => {
        browser
          .waitForElementVisible('*[data-testid="page-container-footer-next"]', 60000)
          .click('*[data-testid="page-container-footer-next"]') // this connects the metamask account to remix
          .pause(2000)
          .waitForElementVisible('*[data-testid="page-container-footer-next"]', 60000)
          .click('*[data-testid="page-container-footer-next"]')
          // .waitForElementVisible('*[data-testid="popover-close"]')
          // .click('*[data-testid="popover-close"]')
      })
      .switchBrowserTab(0) // back to remix
      .waitForElementPresent('*[data-id="settingsNetworkEnv"]')
      .assert.containsText('*[data-id="settingsNetworkEnv"]', 'Sepolia (11155111) network')
  },

  'Should load quick-dapp plugin #group1': function (browser: NightwatchBrowser) {
    if (!checkBrowserIsChrome(browser)) return
    browser.waitForElementPresent('*[data-id="remixIdeSidePanel"]')
      .useCss()
      .addFile('Storage.sol', sources[0]['Storage.sol'])
      .clickLaunchIcon('udapp')
      .clickLaunchIcon('udapp')
      .addAtAddressInstance(address, true, true, false)
      .waitForElementPresent(`*[data-id="unpinnedInstance${address}"]`)
      .clickInstance(0)
      .click('*[data-id="instanceEditIcon"]')
      .pause(5000)
      .frame(0)
      .assert.containsText('*[data-id="quick-dapp-admin"]', 'QuickDapp Admin')
  },

  'Should edit and deploy a dapp to surge.sh #group1': function (browser: NightwatchBrowser) {
    if (!checkBrowserIsChrome(browser)) return

    browser.click('.container.placeholder')
      .perform((done) => {
        browser.findElement('*[data-id="containerColumnC"]', (el: any) => {
          browser.dragAndDrop('*[data-id="handle0x6057361d"]', el.value.getId())
            .dragAndDrop('*[data-id="handleColumnA"]', el.value.getId())
            .click('*[data-id="remove0x1003e2d2"]')
            .click('*[data-id="removeColumnA"]')
            .perform(() => done())
        })
      })
      .setValue('input[data-id="surgeEmail"]', surgeEmail)
      .setValue('input[data-id="surgePassword"]', surgePassword)
      .setValue('input[data-id="surgeSubdomain"]', surgeSubdomain)
      .setValue('input[data-id="functionTitle0x6057361d"]', 'Function Store Title')
      .setValue('input[data-id="functionTitle0x2e64cec1"]', 'Function Retrieve Title')
      .execute((function() {
        document.querySelector('input[data-id="uploadLogo"]').classList.remove('d-none');
      }))
      .setValue('input[data-id="uploadLogo"]', logoFilePath)
      .execute((function() {
        document.querySelector('input[data-id="uploadLogo"]').classList.add('d-none');
      }))
      .click('[for="shareToTwitter"]')
      .click('[for="shareToFacebook"]')
      .click('*[data-id="useNatSpec"]')
      .click('[for="verifiedByEtherscan"]')
      .click('[for="noTerminal"]')
      .click('*[data-id="selectThemesOptions"]')
      .click('*[data-id="dropdown-item-Light"]')
      .click('*[data-id="deployDapp"]')
      .waitForElementVisible('*[data-id="deployResult"]', 20000)
      .perform((done) => {
        browser.getAttribute('*[data-id="deployResult"]', 'class', function (result) {
          // @ts-expect-error
          if (result.value.includes('alert-danger')) {
            browser.click('*[data-id="deployDapp"]').waitForElementVisible('*[data-id="deployResult"]', 20000).perform(() => done())
          } else {
            done()
          }
        })
      })
      .assert.containsText('*[data-id="deployResult"]', `https://${surgeSubdomain}.surge.sh`)
  },

  'Should load and call dapp successfully #group1': function (browser: NightwatchBrowser) {
    if (!checkBrowserIsChrome(browser)) return
    browser
      .switchBrowserTab(1).url(`https://${surgeSubdomain}.surge.sh`)
      .pause(5000)
      .switchBrowserWindow(extension_url, 'MetaMask', (browser) => {
        browser
          .waitForElementVisible('*[data-testid="page-container-footer-next"]', 60000)
          .click('*[data-testid="page-container-footer-next"]') // this connects the metamask account to remix
          .pause(2000)
          .waitForElementVisible('*[data-testid="page-container-footer-next"]', 60000)
          .click('*[data-testid="page-container-footer-next"]')
        // .waitForElementVisible('*[data-testid="popover-close"]')
        // .click('*[data-testid="popover-close"]')
      })
      .switchBrowserTab(1)
      .setValue('input[placeholder="uint256 num"]', '11')
      .pause(1000)
      .click('*[data-id="store - transact (not payable)"]')
      .perform((done) => {
        browser.switchBrowserWindow(extension_url, 'MetaMask', (browser) => {
          browser
            .isVisible({
              selector: 'button[data-testid="popover-close"]',
              locateStrategy: 'css selector',
              suppressNotFoundErrors: true,
              timeout: 3000
            }, (okVisible) => {
              console.log('okVisible', okVisible)
              if (!okVisible.value) {
                console.log('popover not found')
              } else {
                browser.click('button[data-testid="popover-close"]').click('.transaction-status-label--unapproved')
              }
            })
            .waitForElementPresent('[data-testid="page-container-footer-next"]', 60000)
            .click('[data-testid="page-container-footer-next"]') // approve the tx
            .perform(() => done())
        })
      })
      .switchBrowserTab(1) // back to dapp
      .waitForElementVisible('.Toastify__toast--success', 60000)
      .assert.containsText('.Toastify__toast--success', 'success')
      .click('*[data-id="retrieve - call"]')
      .waitForElementVisible('*[data-id="treeViewDiv0"]', 20000)
      .assert.containsText('*[data-id="treeViewDiv0"]', 'uint256: 11')
      .perform((done) => {
        axios.get(`https://${surgeSubdomain}.surge.sh/assets/logo.png?t=${new Date().getTime()}`, { responseType: 'arraybuffer' }).then((resp) => {
          const hash = crypto.createHash('sha256');
          hash.update(resp.data);
          const hashValue = hash.digest('hex');
          console.log('Hash:', hashValue);
          browser.assert.strictEqual(hashValue, logoHash, 'Hash values match!').perform(() => done())
        })
      })
      .assert.containsText('*[data-id="functionTitle0x6057361d"]', 'Function Store Title')
      .assert.containsText('*[data-id="functionTitle0x2e64cec1"]', 'Function Retrieve Title')
      .assert.containsText('*[data-id="dappTitle"]', 'Storage')
      .assert.containsText('*[data-id="dappInstructions"]', 'Store & retrieve value in a variable')
      .assert.elementPresent('.fa-twitter.btn', 'Twitter icon should be present')
      .assert.elementPresent('.fa-facebook.btn', 'Facebook icon should be present')
      .checkElementStyle(':root', '--secondary', '#b3bcc483')
      .element('css selector', '#terminal-view', function (result) {
        browser.assert.strictEqual(result.status, -1, 'terminal should not shown')
      })
      .element('css selector', '*[data-id="function0x1003e2d2"]', function (result) {
        browser.assert.strictEqual(result.status, -1, 'function add should not shown')
      })
      .getLocation('*[data-id="function0x6057361d"]', function (result: any) {
        const funcStoreLocation = result.value
        browser.getLocation('*[data-id="function0x2e64cec1"]', function (result: any) {
          const funcRetrieveLocation = result.value
          browser.assert.strictEqual(funcStoreLocation.y, funcRetrieveLocation.y, 'Both functions should be on the same horizontal line')
          browser.assert.ok(funcStoreLocation.x > funcRetrieveLocation.x, 'Function Store should be on the right of Function Retrieve')
        })
      })
      .getAttribute('a[data-id="viewSourceCode"]', 'href', function (result) {
        browser.assert.strictEqual(result.value, `https://remix.ethereum.org/address/${address}`, 'view source code url should match')
      })
  },

  'Should reset and delete and submit dapp params #group1': function (browser: NightwatchBrowser) {
    if (!checkBrowserIsChrome(browser)) return
    browser.switchBrowserTab(0).frame(0)
      .click('*[data-id="resetFunctions"]')
      .assert.elementPresent('*[data-id="remove0x1003e2d2"]', 'Function add should be present again')
      .click('*[data-id="deleteDapp"]')
      .assert.containsText('*[data-id="quickDappTooltips"]', 'QuickDapp only work for Injected Provider currently')
      .setValue('input[id="formAddress"]', address)
      .setValue('textarea[id="formAbi"]', abi)
      .setValue('input[id="formName"]', 'Storage')
      .setValue('input[id="formNetwork"]', 'Sepolia (11155111) network')
      .click('*[data-id="createDapp"]')
      .assert.containsText('*[data-id="quick-dapp-admin"]', 'QuickDapp Admin')
  },

  'Should teardown dapp successfully #group1': function (browser: NightwatchBrowser) {
    if (!checkBrowserIsChrome(browser)) return
    browser.setValue('input[data-id="surgeSubdomain"]', surgeSubdomain)
      .execute((function() {
        // @ts-expect-error
        document.querySelector('*[data-id="teardownDapp"]').style.display = 'inline-block';
      }))
      .pause(500)
      .click('*[data-id="teardownDapp"]')
      .waitForElementVisible('*[data-id="teardownResult"]', 30000)
      .assert.containsText('*[data-id="teardownResult"]', 'Teardown successfully!')
  }
}

const branch = process.env.CIRCLE_BRANCH;
const isMasterBranch = branch === 'master';

module.exports = {
  ...{} //(branch ? (isMasterBranch ? tests : {}) : tests),
};

const sources = [
  {
    'Storage.sol': {
      content:
      `
      // SPDX-License-Identifier: GPL-3.0

      pragma solidity >=0.8.2 <0.9.0;

      /**
       * @title Storage
       * @dev Store & retrieve value in a variable
       * @custom:dev-run-script ./scripts/deploy_with_ethers.ts
       */
      contract Storage {

          uint256 number;

          /**
           * @dev Store value in variable
           * @param num value to store
           */
          function store(uint256 num) public {
              number = num;
          }

          /**
           * @dev Return value
           * @return value of 'number'
           */
          function retrieve() public view returns (uint256){
              return number;
          }

          function add(uint256 num) public {
              number = number + num;
          }

      }`
    }
  }
]

const abi = JSON.stringify([
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "num",
        "type": "uint256"
      }
    ],
    "name": "add",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "retrieve",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "num",
        "type": "uint256"
      }
    ],
    "name": "store",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
])
