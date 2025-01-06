import { NightwatchBrowser } from 'nightwatch'
import EventEmitter from 'events'

class SelectAccount extends EventEmitter {
  command (this: NightwatchBrowser, account?: string): NightwatchBrowser {
    if (account) {
      this.api
        .click(`*[data-id="runTabSelectAccount"]`) //open the dropdown
        .waitForElementVisible(`*[data-id="${account}"]`)
        .click(`*[data-id="${account}"]`) //close the dropdown
        .perform(() => {
          this.emit('complete')
        })
    } else this.emit('complete')
    return this
  }
}

module.exports = SelectAccount
