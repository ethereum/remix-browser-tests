import { NightwatchBrowser } from "nightwatch"


const tests = {
    before: function (browser: NightwatchBrowser, done: VoidFunction) {
        browser.hideToolTips()
        done()
    },
    'Should create semaphore workspace': function (browser: NightwatchBrowser) {
        browser
            .waitForElementVisible('*[data-id="homeTabGetStartedsemaphore"]', 20000)
            .click('*[data-id="homeTabGetStartedsemaphore"]')
            .pause(3000)
            .windowHandles(function (result) {
                console.log(result.value)
                browser.switchWindow(result.value[1])
                    .waitForElementVisible('*[data-id="treeViewLitreeViewItemcircuits"]')
                    .click('*[data-id="treeViewLitreeViewItemcircuits"]')
                    .waitForElementVisible('*[data-id="treeViewLitreeViewItemcircuits/semaphore.circom"]')
                    .waitForElementVisible('*[data-id="treeViewLitreeViewItemscripts"]')
                    .click('*[data-id="treeViewLitreeViewItemscripts"]')
                    .waitForElementVisible('*[data-id="treeViewLitreeViewItemscripts/groth16"]')
                    .click('*[data-id="treeViewLitreeViewItemscripts/groth16"]')
                    .waitForElementVisible('*[data-id="treeViewLitreeViewItemscripts/groth16/groth16_trusted_setup.ts"]')
                    .waitForElementVisible('*[data-id="treeViewLitreeViewItemscripts/groth16/groth16_zkproof.ts"]')
                    .waitForElementVisible('*[data-id="treeViewLitreeViewItemscripts/plonk"]')
                    .click('*[data-id="treeViewLitreeViewItemscripts/plonk"]')
                    .waitForElementVisible('*[data-id="treeViewLitreeViewItemscripts/plonk/plonk_trusted_setup.ts"]')
                    .waitForElementVisible('*[data-id="treeViewLitreeViewItemscripts/plonk/plonk_zkproof.ts"]')
                    .waitForElementVisible('*[data-id="treeViewLitreeViewItemtemplates"]')
                    .click('*[data-id="treeViewLitreeViewItemtemplates"]')
                    .waitForElementVisible('*[data-id="treeViewLitreeViewItemtemplates/groth16_verifier.sol.ejs"]')
                    .waitForElementVisible('*[data-id="treeViewLitreeViewItemtemplates/plonk_verifier.sol.ejs"]')
            })
    },
    'Should compile a simple circuit using editor play button': function (browser: NightwatchBrowser) {
        browser
            .click('[data-id="treeViewLitreeViewItemcircuits/simple.circom"]')
            .waitForElementVisible('[data-id="play-editor"]')
            .click('[data-id="play-editor"]')
            .pause()
            .waitForElementVisible('[data-id="verticalIconsKindcircuit-compiler"]')
            .waitForElementVisible('[data-id="treeViewLitreeViewItemcircuits/.bin"]')
            .click('[data-id="treeViewLitreeViewItemcircuits/.bin"]')
            .waitForElementVisible('[data-id="treeViewLitreeViewItemcircuits/.bin/simple_js"]')
            .click('[data-id="treeViewLitreeViewItemcircuits/.bin/simple_js"]')
            .waitForElementVisible('[data-id="treeViewLitreeViewItemcircuits/.bin/simple_js/simple.wasm"]')
    },
    'Should compute a witness for a simple circuit #group1': function (browser: NightwatchBrowser) {
        browser
          .clickLaunchIcon('circuit-compiler')
          .frame(0)
          .waitForElementVisible('[data-id="witness_toggler"]')
          .click('[data-id="witness_toggler"]')
          .waitForElementVisible('[data-id="compute_witness_btn"]')
          .waitForElementVisible('[data-id="circuit_input_a"]')
          .waitForElementVisible('[data-id="circuit_input_b"]')
          .setValue('[data-id="circuit_input_a"]', '1')
          .setValue('[data-id="circuit_input_b"]', '2')
          .click('[data-id="compute_witness_btn"]')
          .frameParent()
          .clickLaunchIcon('filePanel')
          .waitForElementPresent('[data-id="treeViewLitreeViewItemcircuits/.bin/simple_js/simple.wtn"]')
          .waitForElementVisible('[data-id="treeViewLitreeViewItemcircuits/.bin/simple_js/simple.wtn"]')
      },
}

module.exports = tests