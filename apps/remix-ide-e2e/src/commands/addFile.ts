import { NightwatchBrowser, NightwatchContractContent } from 'nightwatch'
import EventEmitter from 'events'

class AddFile extends EventEmitter {
  command(this: NightwatchBrowser, name: string, content: NightwatchContractContent): NightwatchBrowser {
    this.api.perform((done) => {
      addFile(this.api, name, content, () => {
        done()
        this.emit('complete')
      })
    })
    return this
  }
}

function addFile (browser: NightwatchBrowser, name: string, content: NightwatchContractContent, done: VoidFunction) {
  browser
    .saveScreenshot('./reports/screenshots/addFile.png')
    .isVisible({
      selector: "//*[@data-id='sidePanelSwapitTitle' and contains(.,'File explorer')]",
      locateStrategy: 'xpath',
      suppressNotFoundErrors: true,
      timeout: 1000   
    }, (okVisible) => {
      if (!okVisible.value) {
        browser.clickLaunchIcon('filePanel')
        .saveScreenshot('./reports/screenshots/addFile2.png')
      }
    })
    .scrollInto('li[data-id="treeViewLitreeViewItemREADME.txt"]')
    .saveScreenshot('./reports/screenshots/addFile3.png')
    .waitForElementVisible('li[data-id="treeViewLitreeViewItemREADME.txt"]')
    .click('li[data-id="treeViewLitreeViewItemREADME.txt"]').pause(1000) // focus on root directory
    .elements('css selector', `li[data-id="treeViewLitreeViewItem${name}"]`, (res) => {
      if (res.value && (res.value as any).length > 0) {
        browser.openFile(name)
          .perform(function () {
            done()
          })
      } else {
        browser.click('[data-id="fileExplorerNewFilecreateNewFile"]')
          .waitForElementContainsText('*[data-id$="/blank"]', '', 60000)
          .sendKeys('*[data-id$="/blank"] .remixui_items', name)
          .sendKeys('*[data-id$="/blank"] .remixui_items', browser.Keys.ENTER)
          .pause(2000)
          .waitForElementVisible(`li[data-id="treeViewLitreeViewItem${name}"]`, 60000)
          .setEditorValue(content.content)
          .pause(1000)
          .perform(function () {
            done()
          })
      }
    })
}

module.exports = AddFile
