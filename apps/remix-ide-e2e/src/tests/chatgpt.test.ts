'use strict'
import { NightwatchBrowser } from 'nightwatch'
import init from '../helpers/init'

module.exports = {
  before: function (browser: NightwatchBrowser, done: VoidFunction) {
    init(browser, done)
  },
  'Should ask a simple chat gpt question #group1': function (browser: NightwatchBrowser) {
    browser
      .waitForElementVisible('*[data-id="terminalCli"]', 10000)
      .executeScriptInTerminal('gpt 123')
      .pause(2000)
      .waitForElementContainsText('*[data-id="terminalJournal"]', 'Mockapi', 60000)
  },
  'Should ask a simple solidity chat gpt question #group1': function (browser: NightwatchBrowser) {
    browser
      .waitForElementVisible('*[data-id="terminalCli"]', 10000)
      .executeScriptInTerminal('sol-gpt What are function modifiers')
      .pause(2000)
      .waitForElementContainsText('*[data-id="terminalJournal"]', 'Solidity', 60000)
  },
}