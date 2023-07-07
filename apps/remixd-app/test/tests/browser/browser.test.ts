import { NightwatchBrowser } from 'nightwatch'

declare global {
  interface Window { testmode: boolean; }
}


module.exports = {
  before: function (browser: NightwatchBrowser, done: VoidFunction) {
    done()
  },
  'open app': function (browser: NightwatchBrowser) {
    browser.url('http://localhost:8080')
      //.switchBrowserTab(0)
      .waitForElementVisible('[id="remixTourSkipbtn"]')
      .click('[id="remixTourSkipbtn"]')
  },
  'open localhost': function (browser: NightwatchBrowser) {
    browser
      .pause(10000)
      .waitForElementVisible('#icon-panel', 2000)
      .waitForElementVisible('#icon-panel div[plugin="pluginManager"]')
      .clickLaunchIcon('pluginManager')
      .scrollAndClick('#pluginManager *[data-id="pluginManagerComponentActivateButtonremixd"]')
      .waitForElementVisible('*[data-id="remixdConnect-modal-footer-ok-react"]', 2000)
      .pause(2000)
      .click('*[data-id="remixdConnect-modal-footer-ok-react"]')
      .pause(5000)
      .clickLaunchIcon('filePanel')
      .end()
  },

}