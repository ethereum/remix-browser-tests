import { NightwatchBrowser } from 'nightwatch'
import EventEmitter from 'events'

const selector = '.udapp_contractNames'

class SelectContract extends EventEmitter {
  command(this: NightwatchBrowser, contractName: string): NightwatchBrowser {
    this.api
      .waitForElementVisible(selector)
      .waitForElementPresent(`${selector} option[value="${contractName}"]`)
      .click(`${selector} option[value="${contractName}"]`)
      .perform(() => this.emit('complete'))
    return this
  }
}

module.exports = SelectContract
