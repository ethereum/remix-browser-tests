import { NightwatchBrowser } from 'nightwatch'
import EventEmitter from 'events'

class EnableClipBoard extends EventEmitter {
  command (this: NightwatchBrowser, remember:boolean, accept: boolean): NightwatchBrowser {
    const browser = this.api
    if(browser.isChrome()){
      const chromeBrowser = (browser as any).chrome
      chromeBrowser.setPermission('clipboard-read', 'granted')
      chromeBrowser.setPermission('clipboard-write', 'granted')
      // test it
      browser.executeAsyncScript(function (done) {
        navigator.clipboard.writeText('test').then(function () {
          navigator.clipboard.readText().then(function (text) {
            console.log('Pasted content: ', text)
            done(text)
          }).catch(function (err) {
            console.error('Failed to read clipboard contents: ', err)
            done()
          })
        }).catch(function (err) {
          console.error('Failed to write to clipboard: ', err)
          done()
        })
      }, [], function (result) {
        browser.assert.ok((result as any).value === 'test', 'copy paste should work')
      })
    }
    this.emit('complete')
    return this
  }
}

module.exports = EnableClipBoard
