'use strict'
import { NightwatchBrowser } from 'nightwatch'
import init from '../helpers/init'

declare global {
  interface Window { testplugin: { name: string, url: string }; }
}

const tests = {
  '@disabled': true,
  before: function (browser: NightwatchBrowser, done: VoidFunction) {
    init(browser, done, null)
  },

  'Should show fork and delete VM state icons #group1': function (browser: NightwatchBrowser) {
    browser
      .clickLaunchIcon('udapp')
      .waitForElementVisible('*[data-id="selected-provider-vm-cancun"]')
      .waitForElementVisible('*[data-id="fork-state-icon"]')
      .waitForElementVisible('*[data-id="delete-state-icon"]')
  },
  'Should show toaster while trying fork and delete VM state without state #group1': function (browser: NightwatchBrowser) {
    browser
      .waitForElementVisible('*[data-id="fork-state-icon"]')
      .click('*[data-id="fork-state-icon"]')
      .waitForElementVisible(
        {
          selector: "//*[@data-shared='tooltipPopup' and contains(.,'State not available to fork')]",
          locateStrategy: 'xpath'
        }
      )
      .waitForElementVisible('*[data-id="delete-state-icon"]')
      .click('*[data-id="delete-state-icon"]')
      .waitForElementVisible(
        {
          selector: "//*[@data-shared='tooltipPopup' and contains(.,'State not available to delete')]",
          locateStrategy: 'xpath'
        }
      )
  },
  'Should fork state successfully #group1': function (browser: NightwatchBrowser) {
    browser
      .openFile('contracts')
      .openFile('contracts/1_Storage.sol')
      .verifyContracts(['Storage'])
      .clickLaunchIcon('udapp')
      .click('[data-id="Deploy - transact (not payable)"]')
      .clickInstance(0)
      .clickFunction('store - transact (not payable)', { types: 'uint256 num', values: '"55"' })
      .testFunction('last',
        {
          status: '0x1 Transaction mined and execution succeed',
          'decoded input': { 'uint256 num': '55' }
        })
      .clickFunction('retrieve - call')
      .testFunction('last',
        {
          'decoded output': { '0': 'uint256: 55' }
        })
      .click('*[data-id="fork-state-icon"]')
      .waitForElementVisible('*[data-id="udappNotifyModalDialogModalTitle-react"]')
      .click('input[data-id="modalDialogForkState"]')
      .setValue('input[data-id="modalDialogForkState"]', 'forkedState_1')
      .modalFooterOKClick('udappNotify')
      // check toaster for forked state
      .waitForElementVisible(
        {
          selector: '//*[@data-shared="tooltipPopup" and contains(.,"VM state \'forkedState_1\' forked")]',
          locateStrategy: 'xpath'
        }
      )
      // check if forked state is selected as current environment
      .assert.elementPresent('*[data-id="selected-provider-vm-fs-forkedState_1"]')
      // check if forked state file is created with expected details
      .openFile('.states/forked_states/forkedState_1.json')
      .getEditorValue((content) => {
        browser.assert.ok(content.indexOf(`"latestBlockNumber": "0x2"`) !== -1)
        browser.assert.ok(content.indexOf(`"stateName": "forkedState_1"`) !== -1)
        browser.assert.ok(content.indexOf(`"forkName": "cancun"`) !== -1)
        browser.assert.ok(content.indexOf(`"savingTimestamp":`) !== -1)
        browser.assert.ok(content.indexOf(`"db":`) !== -1)
        browser.assert.ok(content.indexOf(`"blocks":`) !== -1)
      })
  },
  'Should show fork states provider in environment explorer & make txs using forked state #group1': function (browser: NightwatchBrowser) {
    browser
      .clickLaunchIcon('udapp')
      .waitForElementVisible('[data-id="settingsSelectEnvOptions"]')
      .click('[data-id="settingsSelectEnvOptions"] button')
      .waitForElementVisible(`[data-id="dropdown-item-another-chain"]`)
      .click(`[data-id="dropdown-item-another-chain"]`)
      .assert.visible('[data-id="remixUIGSDeploy to an In-browser Forked State."]')
      .assert.elementPresent('[data-id="remixUIGSforkedState_1"]')
      .assert.elementPresent('[data-id="vm-fs-forkedState_1-pinned"]')
      .assert.textContains('[data-id="vm-fs-forkedState_1desc"]', 'Latest Block: 2')
      .assert.not.elementPresent('[data-id="remixUIGSforkedState_2"]')
      .switchEnvironment('vm-cancun')
      .openFile('contracts/1_Storage.sol')
      .verifyContracts(['Storage'])
      .clickLaunchIcon('udapp')
      .click('*[data-id="Deploy - transact (not payable)"]')
      .click('*[data-id="fork-state-icon"]')
      .waitForElementVisible('*[data-id="udappNotifyModalDialogModalTitle-react"]')
      .click('input[data-id="modalDialogForkState"]')
      .setValue('input[data-id="modalDialogForkState"]', 'forkedState_2')
      .modalFooterOKClick('udappNotify')
      .waitForElementVisible('*[data-shared="tooltipPopup"]', 10000)
      .assert.textContains('*[data-shared="tooltipPopup"]', `VM state 'forkedState_2' forked and selected as current environment.`)
      // check if 'forkedState_2' is selected as current environment 
      .assert.elementPresent('*[data-id="selected-provider-vm-fs-forkedState_2"]')
      // check if 'forkedState_2' is present in environment explorer
      .assert.elementPresent('[data-id="remixUIGSforkedState_2"]')
      // check if 'forkedState_2' is pinned in environment explorer
      .assert.elementPresent('[data-id="vm-fs-forkedState_2-pinned"]')
      // 'forkedState_2' should have 3 blocks
      .assert.textContains('[data-id="vm-fs-forkedState_2desc"]', 'Latest Block: 3')
      .click('*[data-id="Deploy - transact (not payable)"]')
      .clickInstance(0)
      .clickFunction('store - transact (not payable)', { types: 'uint256 num', values: '"555"' })
      // block number should be 5 after 2 txs
      .testFunction('last',
        {
          status: '0x1 Transaction mined and execution succeed',
          'block number': '5',
          'decoded input': { 'uint256 num': '555' }
        })
  },
  'Should delete state successfully #group1': function (browser: NightwatchBrowser) {
    browser
      .switchEnvironment('vm-cancun')
      .openFile('contracts/1_Storage.sol')
      .verifyContracts(['Storage'])
      .clickLaunchIcon('udapp')
      .click('*[data-id="Deploy - transact (not payable)"]')
      .pause(10000)
      .assert.textContains('*[data-id="deployedContractsBadge"]', '1')
      .click(('*[data-id="delete-state-icon"]'))
      .waitForElementVisible('*[data-id="udappNotifyModalDialogModalTitle-react"]')
      .waitForElementVisible('*[data-id="deleteVmStateModal"]')
      .modalFooterOKClick('udappNotify')
      .waitForElementVisible('*[data-shared="tooltipPopup"]', 10000)
      // check if toaster is shown
      .assert.textContains('*[data-shared="tooltipPopup"]', `VM state deleted successfully.`)
      // check that there are no instances
      .assert.textContains('*[data-id="deployedContractsBadge"]', '0')
      // check if state file is deleted
      .openFile('.states/vm-cancun')
      .assert.not.elementPresent('*[data-id="treeViewDivDraggableItem.states/vm-cancun/state.json"]')
  }
}

module.exports = {
  ...tests
};
