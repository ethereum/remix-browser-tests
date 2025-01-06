'use strict'
import { NightwatchBrowser } from 'nightwatch'


module.exports = {
  '@disabled': true,
  'Should load the testmigration url #group1': function (browser: NightwatchBrowser) {
    browser.url('http://127.0.0.1:8080?e2e_testmigration=true')
      .pause(6000)
      .switchBrowserTab(0)
      .maximizeWindow()
      .waitForElementVisible('*[data-id="skipbackup-btn"]', 5000)
      .click('*[data-id="skipbackup-btn"]')
      .pause(5000)
      .waitForElementVisible('*[data-id="remixIdeSidePanel"]', 10000)
      .hideToolTips()
  },
  'Should load the testmigration url and refresh and still have test data #group7': function (browser: NightwatchBrowser) {
    browser.url('http://127.0.0.1:8080?e2e_testmigration=true')
      .pause(6000)
      .switchBrowserTab(0)
      .maximizeWindow()
      .waitForElementVisible('*[data-id="skipbackup-btn"]', 5000)
      .click('*[data-id="skipbackup-btn"]')
      .pause(5000)
      .waitForElementVisible('*[data-id="remixIdeSidePanel"]', 10000)
      .hideToolTips()
      .refreshPage()
  },
  'should have indexedDB storage in terminal #group1 #group7': function (browser: NightwatchBrowser) {
    browser.assert.containsText('*[data-id="terminalJournal"]', 'indexedDB')
  },
  'Should fallback to localstorage with default data #group2': function (browser: NightwatchBrowser) {
    browser.url('http://127.0.0.1:8080?e2e_testmigration_fallback=true')
      .hideToolTips()
      .pause(6000)
      .switchBrowserTab(0)
      .maximizeWindow()
      .pause(5000)
      .waitForElementVisible('*[data-id="remixIdeSidePanel"]', 10000)
      .hideToolTips()
      .waitForElementVisible('div[data-id="filePanelFileExplorerTree"]')
      .openFile('README.txt')
      .waitForElementVisible('*[id="editorView"]', 10000)
      .getEditorValue((content) => {
        browser.assert.ok(content.includes('Output from script will appear in remix terminal.'))
      })
      .click('*[data-id="treeViewLitreeViewItemcontracts"]')
      .openFile('contracts/1_Storage.sol')
      .waitForElementVisible('*[id="editorView"]', 10000)
      .getEditorValue((content) => {
        browser.assert.ok(content.includes('function retrieve() public view returns (uint256){'))
      })
  },
  'Should load the testmigration url with local storage anabled #group3': function (browser: NightwatchBrowser) {
    browser.url('http://127.0.0.1:8080?e2e_testmigration=true&e2e_testmigration_fallback=true')
      .pause(6000)
      .switchBrowserTab(0)
      .maximizeWindow()
      .waitForElementVisible('*[data-id="skipbackup-btn"]', 5000)
      .click('*[data-id="skipbackup-btn"]')
      .pause(5000)
      .waitForElementVisible('*[data-id="remixIdeSidePanel"]', 10000)
      .hideToolTips()
  },
  'Should generate error in migration by deleting indexedDB and falling back to local storage with test #group5': function (browser: NightwatchBrowser) {
    browser.url('http://127.0.0.1:8080?e2e_testmigration=true')
      .pause(6000)
      .switchBrowserTab(0)
      .maximizeWindow().execute(('delete window.indexedDB'))
      .waitForElementVisible('*[data-id="skipbackup-btn"]', 5000)
      .click('*[data-id="skipbackup-btn"]')
      .pause(5000)
      .waitForElementVisible('*[data-id="remixIdeSidePanel"]', 10000)
      .hideToolTips()
  },
  'should have localstorage storage in terminal #group2 #group3 #group5': function (browser: NightwatchBrowser) {
    browser.assert.containsText('*[data-id="terminalJournal"]', 'localstorage')
  },
  'Should have README file with TEST README as content #group1 #group3': function (browser: NightwatchBrowser) {
    browser
      .waitForElementVisible('*[data-id="remixIdeSidePanel"]', 5000)
      .waitForElementVisible('div[data-id="filePanelFileExplorerTree"]')
      .openFile('TEST_README.txt')
      .waitForElementVisible('*[id="editorView"]', 10000)
      .getEditorValue((content) => {
        browser.assert.equal(content, 'TEST README')
      })
  },
  // these are test data entries
  'Should have a workspace_test #group1 #group3 #group5 #group7': function (browser: NightwatchBrowser) {
    browser.waitForElementVisible('*[data-id="remixIdeSidePanel"]', 5000)
      .switchWorkspace('workspace_test')
      .waitForElementVisible('*[data-id="treeViewLitreeViewItemtest_contracts"]')
  },
  'Should have a sol file with test data #group1 #group3 #group5 #group7': function (browser: NightwatchBrowser) {
    browser.waitForElementVisible('*[data-id="remixIdeSidePanel"]', 5000)
      .click('*[data-id="treeViewLitreeViewItemtest_contracts"]')
      .openFile('test_contracts/1_Storage.sol')
      .getEditorValue((content) => {
        browser.assert.equal(content, 'testing')
      })
  },
  'Should have an artifacts file with JSON test data #group1 #group3 #group5 #group7': function (browser: NightwatchBrowser) {
    browser.waitForElementVisible('*[data-id="remixIdeSidePanel"]', 5000)
      .click('*[data-id="treeViewLitreeViewItemtest_contracts/artifacts"]')
      .openFile('test_contracts/artifacts/Storage_metadata.json')
      .waitForElementVisible('*[id="editorView"]', 10000)
      .getEditorValue((content) => {
        const metadata = JSON.parse(content)
        browser.assert.equal(metadata.test, 'data')
      })
  },
  'Should have an empty workspace #group1 #group3 #group5 #group7': function (browser: NightwatchBrowser) {
    browser.waitForElementVisible('*[data-id="remixIdeSidePanel"]', 5000)
      .switchWorkspace('emptyspace')
  },
  // end of test data entries
  'Should load with all storage blocked #group4': function (browser: NightwatchBrowser) {
    browser.url('http://127.0.0.1:8080?e2e_testblock_storage=true')
      .hideToolTips()
      .pause(6000)
      .switchBrowserTab(0)
      .maximizeWindow()
      .assert.containsText('.alert-warning', 'Your browser does not support')
  },
  'Should with errors #group6': function (browser: NightwatchBrowser) {
    browser.url('http://127.0.0.1:8080?e2e_testmigration=true')

      .pause(6000)
      .switchBrowserTab(0)
      .maximizeWindow().execute('delete window.localStorage')
      .waitForElementVisible('*[data-id="skipbackup-btn"]', 5000)
      .click('*[data-id="skipbackup-btn"]')
      .hideToolTips()
      .assert.containsText('.alert-danger', 'An unknown error')
  },

}
