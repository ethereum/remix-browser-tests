import { NightwatchBrowser } from 'nightwatch'
import EventEmitter from 'events'

class switchEnvironment extends EventEmitter {
  command (this: NightwatchBrowser, provider: string): NightwatchBrowser {
    this.api.useCss().waitForElementVisible('[data-id="settingsSelectEnvOptions"]')
      .perform((done) => {
        this.api.isPresent({ selector: `[data-id="selected-provider-${provider}"]`, suppressNotFoundErrors: true, timeout: 5000 }, (result) => {
          if (result.value) {
            done()
          } else {
            browser.perform(() => {
              this.api
                .click('[data-id="settingsSelectEnvOptions"] button') // open dropdown
                .isPresent({ selector: `[data-id="dropdown-item-${provider}"]`, suppressNotFoundErrors: true, timeout: 5000 }, (result) => {
                  console.log(result)
                  this.api.click('[data-id="settingsSelectEnvOptions"] button') // close dropdown
                  if (!result.value) {
                    this.api.pinGrid(provider, true)
                      .click('[data-id="settingsSelectEnvOptions"] button')
                      .waitForElementVisible(`[data-id="dropdown-item-${provider}"]`)
                      .click(`[data-id="dropdown-item-${provider}"]`)
                      .perform(() => done())
                  } else {
                    browser.click('[data-id="settingsSelectEnvOptions"] button')
                      .waitForElementVisible(`[data-id="dropdown-item-${provider}"]`)
                      .click(`[data-id="dropdown-item-${provider}"]`)
                      .perform(() => done())
                  }
                })
            })
          }
        })
      }).perform(() => this.emit('complete'))

    return this
  }
}

module.exports = switchEnvironment
