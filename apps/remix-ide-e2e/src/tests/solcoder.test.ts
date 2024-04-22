'use strict'
import { NightwatchBrowser } from 'nightwatch'
import init from '../helpers/init'
import fs from 'fs'
module.exports = {
    before: function (browser: NightwatchBrowser, done: VoidFunction) {
        init(browser, done)
    },
    'open file and go to number = num': async function (browser: NightwatchBrowser) {
        browser
            .openFile('contracts')
            .openFile('contracts/1_Storage.sol')
            .waitForElementVisible('*[data-id="remix_ai_switch"]', 10000)
            .click('*[data-id="remix_ai_switch"]')
            .waitForElementContainsText('*[data-id="terminalJournal"]', 'Solidity copilot activated!', 60000)
        const path = "//*[@class='view-line' and contains(.,'number') and contains(.,'=')]"
        browser.waitForElementVisible('#editorView')
            .click({
                locateStrategy: 'xpath',
                selector: path
            })
            .perform(function () {
                const actions = this.actions({ async: true });
                return actions
                    .sendKeys(this.Keys.ENTER)
                    .sendKeys('// function add 3 numbers')
                    .sendKeys(this.Keys.ENTER)
            })
            .waitForElementPresent('.monaco-alert')
            .waitForElementPresent({
                selector: "//*[contains(@class, 'monaco-alert') and normalize-space()]",
                locateStrategy: 'xpath',
                timeout: 30000    
            })
            .execute(function () {
                var alerts = document.querySelectorAll('.monaco-alert');
                const returndata = []
                alerts.forEach(function (alert) {
                    returndata.push(alert.textContent)
                });
                return returndata
            }, [], function (result) {
                console.log(result)
                browser.pause()
            })
        // do stuff to check the resuls
    },
}