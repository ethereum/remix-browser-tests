import { NightwatchBrowser } from 'nightwatch'
import EventEmitter from 'events'

/*
  Check if the last log in the console contains a specific text
*/
class JournalLastChildIncludes extends EventEmitter {
  command (this: NightwatchBrowser, val: string): NightwatchBrowser {
    this.api
      .waitForElementVisible('*[data-id="terminalJournal"]', 10000)
      .pause(1000)
      .getText('*[data-id="terminalJournal"]', (result) => {
        console.log('JournalLastChildIncludes', result.value)
        if (typeof result.value === 'string' && result.value.indexOf(val) === -1) return this.api.assert.fail(`wait for ${val} in ${result.value}`)
        else this.api.assert.ok(true, `<*[data-id="terminalJournal"]> contains ${val}.`)
        this.emit('complete')
      })
    return this
  }
}

module.exports = JournalLastChildIncludes
