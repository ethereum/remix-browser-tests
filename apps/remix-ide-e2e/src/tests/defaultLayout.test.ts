'use strict'
import { NightwatchBrowser } from 'nightwatch'
import init from '../helpers/init'

module.exports = {
  before: function (browser: NightwatchBrowser, done: VoidFunction) {
    init(browser, done, 'http://127.0.0.1:8080', false)
  },

  'Loads Icon\'s Panel': function (browser: NightwatchBrowser) {
    browser.waitForElementVisible('div[data-id="remixIdeIconPanel"]', 10000)
      .waitForElementVisible('div[data-id="verticalIconsHomeIcon"]')
      .waitForElementVisible('div[plugin="filePanel"]')
      .waitForElementVisible('div[plugin="pluginManager"]')
      .waitForElementVisible('div[plugin="settings"]')
  },

  'Loads Side Panel': function (browser: NightwatchBrowser) {
    browser.waitForElementVisible('div[data-id="remixIdeSidePanel"]')
      .assert.containsText('h6[data-id="sidePanelSwapitTitle"]', 'FILE EXPLORERS')
      .waitForElementVisible('div[data-id="filePanelFileExplorerTree"]')
      .waitForElementVisible('[data-id="treeViewLitreeViewItemcontracts"]')
      .waitForElementVisible('[data-id="treeViewLitreeViewItemscripts"]')
      .waitForElementVisible('[data-id="treeViewLitreeViewItemtests"]')
      .waitForElementVisible('[data-id="treeViewLitreeViewItemREADME.txt"]')
  },

  'Loads Main View': function (browser: NightwatchBrowser) {
    browser.waitForElementVisible('div[data-id="mainPanelPluginsContainer"]')
      .waitForElementVisible('div[data-id="landingPageHomeContainer"]')
      .waitForElementVisible('div[data-id="landingPageHpSections"]')
      .waitForElementVisible('div[data-id="terminalContainer"]')
  },

  'Loads terminal': function (browser: NightwatchBrowser) {
    browser
      .waitForElementVisible('div[data-id="terminalCli"]', 10000)
      .journalLastChildIncludes('Welcome to Remix')
  },

  'Toggles Side Panel': function (browser: NightwatchBrowser) {
    browser.waitForElementVisible('div[data-id="remixIdeSidePanel"]')
      .assert.containsText('h6[data-id="sidePanelSwapitTitle"]', 'FILE EXPLORERS')
      .clickLaunchIcon('filePanel')
      .assert.hidden('div[data-id="remixIdeSidePanel"]')
      .clickLaunchIcon('filePanel')
      .assert.visible('div[data-id="remixIdeSidePanel"]')
      .assert.containsText('h6[data-id="sidePanelSwapitTitle"]', 'FILE EXPLORERS')
  },

  'Toggles Terminal': function (browser: NightwatchBrowser) {
    browser.waitForElementVisible('div[data-id="terminalContainer"]')
      .pause(5000)
      .assert.visible('div[data-id="terminalContainerDisplay"]')
      .click('i[data-id="terminalToggleIcon"]')
      .checkElementStyle('div[data-id="terminalToggleMenu"]', 'height', '35px')
      .click('i[data-id="terminalToggleIcon"]')
      .assert.visible('div[data-id="terminalContainerDisplay"]')
  },

  'Switch Tabs using tabs icon': function (browser: NightwatchBrowser) {
    browser
      .waitForElementVisible('div[data-id="filePanelFileExplorerTree"]')
      .click('[data-id="treeViewLitreeViewItemcontracts"]')
      .openFile('contracts/3_Ballot.sol')
      .assert.containsText('div[title="default_workspace/contracts/3_Ballot.sol"]', '3_Ballot.sol')
      .click('span[class^=dropdownCaret]')
      .click('#homeItem')
      .assert.containsText('div[title="home"]', 'Home')
      .end()
  }
}
