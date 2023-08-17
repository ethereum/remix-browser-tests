'use strict'
import { ExternalProfile, LocationProfile, Profile } from '@remixproject/plugin-utils'
import { NightwatchBrowser } from 'nightwatch'
import init from '../helpers/init'

declare global {
  interface Window { testmode: boolean; }
}

const localPluginData: Profile & LocationProfile & ExternalProfile = {
  name: 'localPlugin',
  displayName: 'Local Plugin',
  canActivate: ['dGitProvider', 'flattener', 'solidityUnitTesting', 'udapp', 'hardhat-provider'],
  url: 'http://localhost:9999',
  location: 'sidePanel'
}

const getBrowserLogs = async function (browser: NightwatchBrowser) {
  browser.getLog('browser', (logEntries) => {
    if (logEntries && logEntries.length > 0) {
      console.log('Browser log:')
      console.log(logEntries)
    }
  })
}

const debugValues = async function (browser: NightwatchBrowser, field: string, expected: any) {
  return new Promise((resolve) => {
    if (!expected) {
      resolve(true)
      return
    }
    browser.waitForElementVisible(`//*[@id="${field}"]`).getText(`//*[@id="${field}"]`, (result) => {
      console.log(result)
      if (!result.value.toString().includes(expected)) {
        console.log('Actual result:')
        console.log(result.value.toString())
        console.log('Expected result:')
        console.log(expected)
        getBrowserLogs(browser)
        browser.assert.ok(false, 'Returned value from call does not match expected value.')
      } else {
        browser.assert.ok(true)
      }
      resolve(true)
    })
  })
}

const setPayload = async (browser: NightwatchBrowser, payload: any) => {
  return new Promise((resolve) => {
    if (typeof payload !== 'string') payload = JSON.stringify(payload)
    browser.clearValue('//*[@id="payload"]').pause(500).setValue('//*[@id="payload"]', payload, (result) => {
      resolve(result)
    })
  })
}

const clearPayLoad = async (browser: NightwatchBrowser) => {
  return new Promise((resolve) => {
    browser.clearValue('//*[@id="payload"]', () => {
      resolve(true)
    })
  })
}

const clickButton = async (browser: NightwatchBrowser, buttonText: string, waitResult: boolean = true) => { // eslint-disable-line
  return new Promise((resolve) => {
    browser.useXpath().waitForElementVisible(`//*[@data-id='${buttonText}']`).pause(100)
      .click(`//*[@data-id='${buttonText}']`, async () => {
        await checkForAcceptAndRemember(browser)
        if (waitResult) {
          browser.waitForElementContainsText('//*[@id="callStatus"]', 'stop').perform(() => resolve(true))
        } else {
          resolve(true)
        }
      })
  })
}

const checkForAcceptAndRemember = async function (browser: NightwatchBrowser) {
  return new Promise((resolve) => {
    browser.frameParent(() => {
      browser.pause(1000).element('xpath', '//*[@data-id="permissionHandlerRememberUnchecked"]', (visible: any) => {
        if (visible.status && visible.status === -1) {

          browser.pause(1000).element('xpath', '//*[@data-id="PermissionHandler-modal-footer-ok-react"]', (okPresent: any) => {
            if ((okPresent.status && okPresent.status === -1) || okPresent.value === false) {
              // @ts-ignore
              browser.frame(0, () => { resolve(true) })
            } else {
              browser
              .useXpath()
              .isVisible('//*[@data-id="PermissionHandler-modal-footer-ok-react"]', (okVisible: any) => {
                if (okVisible.value) {
                  browser.click('//*[@data-id="PermissionHandler-modal-footer-ok-react"]', () => {
                    // @ts-ignore
                    browser.frame(0, () => { resolve(true) })
                  })
                } else {
                  // @ts-ignore
                  browser.frame(0, () => { resolve(true) })
                }
              })
            }
          })



        } else {
          browser.waitForElementVisible('//*[@data-id="permissionHandlerRememberUnchecked"]')
          .click('//*[@data-id="permissionHandlerRememberUnchecked"]')
          .waitForElementVisible('//*[@data-id="PermissionHandler-modal-footer-ok-react"]')
          .click('//*[@data-id="PermissionHandler-modal-footer-ok-react"]', () => {
            // @ts-ignore
            browser.frame(0, () => { resolve(true) })
          })
        }
      })
    })
  })
}

/**
 * performs an action on the test local plugin calling a method on a plugin
 *
 * @param {NightwatchBrowser} browser
 * @param {string} buttonText the button which needs to be clicked formatted as pluginname:methodname, ie 'fileManager:writeFile'
 * @param {any} methodResult can be a string expected or an object. it is the result of the method called.
 * @param {any} eventResult can be a string expected or an object. it is the event generated by the method called.
 * @param {any} payload can be a string expected or an object. it is the payload passed to the call
 * @return {Promise}
 */

const clickAndCheckLog = async (browser: NightwatchBrowser, buttonText: string, methodResult: any, eventResult: any, payload: any, waitResult: boolean = true) => { // eslint-disable-line
  if (payload) {
    await setPayload(browser, payload)
  } else {
    await clearPayLoad(browser)
  }
  if (methodResult && typeof methodResult !== 'string') { methodResult = JSON.stringify(methodResult) }
  if (eventResult && typeof eventResult !== 'string') { eventResult = JSON.stringify(eventResult) }
  if (buttonText) {
    await clickButton(browser, buttonText, waitResult)
  }
  if (methodResult) {
    await debugValues(browser, 'methods', methodResult)
  }
  if (eventResult) {
    await debugValues(browser, 'events', eventResult)
  }
}

const assertPluginIsActive = function (browser: NightwatchBrowser, id: string, shouldBeVisible: boolean) {
  if (shouldBeVisible) {
    browser.waitForElementVisible(`//*[@data-id="verticalIconsKind${id}"]`)
  } else {
    browser.waitForElementNotPresent(`//*[@data-id="verticalIconsKind${id}"]`)
  }
}

module.exports = {
  '@disabled': true,
  before: function (browser: NightwatchBrowser, done: VoidFunction) {
    init(browser, done) // , 'http://localhost:8080', false)
  },

  afterEach: function (browser: NightwatchBrowser) {
    browser.getLog('browser', (logEntries) => {
      console.log(logEntries)
    })
  },

  'Should connect a local plugin': function (browser: NightwatchBrowser) {
    browser.addLocalPlugin(localPluginData)
      // @ts-ignore
      .frame(0).useXpath()
  },

  // UDAPP
  // 'Should get accounts #group1': async function (browser: NightwatchBrowser) {
  //   await clickAndCheckLog(browser, 'udapp:getAccounts', '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4', null, null)
  // },

  'Should select another provider #group1': async function (browser: NightwatchBrowser) {
    await clickAndCheckLog(browser, 'udapp:setEnvironmentMode', null, null, { context: 'vm-berlin' })
    await browser
      .frameParent()
      .useCss()
      .clickLaunchIcon('udapp')
      .waitForElementContainsText('#selectExEnvOptions button', 'Remix VM (Berlin)')
      .clickLaunchIcon('localPlugin')
      .useXpath()
      // @ts-ignore
      .frame(0)
  },
  // context menu item

  'Should create context menu item #group1': async function (browser: NightwatchBrowser) {
    await clickAndCheckLog(browser, 'filePanel:registerContextMenuItem', null, null, {
      id: 'localPlugin',
      name: 'testCommand',
      label: 'testCommand',
      type: [],
      extension: ['.sol'],
      path: [],
      pattern: []
    })
    await browser.useXpath().frameParent(async () => {
      browser.useCss().clickLaunchIcon('filePanel')
        .waitForElementVisible('[data-id="treeViewLitreeViewItemcontracts"]').element('css selector', '[data-id="treeViewLitreeViewItemcontracts/1_Storage.sol"]', (visible: any) => {
          if (visible.status && visible.status === -1) {
            browser.click('[data-id="treeViewLitreeViewItemcontracts"]')
          }
        })
        .waitForElementVisible('[data-id="treeViewLitreeViewItemcontracts/1_Storage.sol"]')
        .rightClickCustom('[data-id="treeViewLitreeViewItemcontracts/1_Storage.sol"]').useXpath().waitForElementVisible('//*[@id="menuitemtestcommand"]').click('//*[@id="menuitemtestcommand"]', async () => {
          // @ts-ignore
          browser.click('//*[@data-id="verticalIconsKindlocalPlugin"]').frame(0, async () => {
            await clickAndCheckLog(browser, null, { id: 'localPlugin', name: 'testCommand', label: 'testCommand', type: [], extension: ['.sol'], path: ['contracts/1_Storage.sol'], pattern: [], group: 99 }, null, null)
          })
        })
    })
  },

  // FILESYSTEM

  'Should get current workspace #group7': async function (browser: NightwatchBrowser) {
    await clickAndCheckLog(browser, 'filePanel:getCurrentWorkspace', { name: 'default_workspace', isLocalhost: false, absolutePath: '.workspaces/default_workspace' }, null, null)
  },

  'Should get current files #group7': async function (browser: NightwatchBrowser) {
    await clickAndCheckLog(browser, 'fileManager:readdir', {
      contracts: { isDirectory: true },
      scripts: { isDirectory: true },
      tests: { isDirectory: true },
      'README.txt': { isDirectory: false },
      '.prettierrc.json': { isDirectory: false },
    }, null, '/')
  },
  'Should throw error on current file #group7': async function (browser: NightwatchBrowser) {
    await clickAndCheckLog(browser, 'fileManager:getCurrentFile', 'Error from IDE : Error: No such file or directory No file selected', null, null)
  },
  'Should open readme.txt #group7': async function (browser: NightwatchBrowser) {
    await clickAndCheckLog(browser, 'fileManager:open', null, { event: 'currentFileChanged', args: ['README.txt'] }, 'README.txt')
  },
  'Should have current file #group7': async function (browser: NightwatchBrowser) {
    await clickAndCheckLog(browser, 'fileManager:getCurrentFile', 'README.txt', null, null)
  },
  'Should create dir #group7': async function (browser: NightwatchBrowser) {
    await clickAndCheckLog(browser, 'fileManager:mkdir', null, null, 'testdir')
    await clickAndCheckLog(browser, 'fileManager:readdir', 'testdir', null, '/')
  },
  'Should get file #group7': async function (browser: NightwatchBrowser) {
    await clickAndCheckLog(browser, 'fileManager:getFile', 'REMIX DEFAULT WORKSPACE', null, 'README.txt')
  },
  'Should close all files #group7': async function (browser: NightwatchBrowser) {
    await clickAndCheckLog(browser, 'fileManager:closeAllFiles', null, { event: 'noFileSelected', args: [] }, null)
  },

  'Should switch to file #group2': async function (browser: NightwatchBrowser) {
    await clickAndCheckLog(browser, 'fileManager:switchFile', null, { event: 'currentFileChanged', args: ['contracts/1_Storage.sol'] }, 'contracts/1_Storage.sol')
    await clickAndCheckLog(browser, 'fileManager:getCurrentFile', 'contracts/1_Storage.sol', null, null)
    await clickAndCheckLog(browser, 'fileManager:switchFile', null, { event: 'currentFileChanged', args: ['README.txt'] }, 'README.txt')
    await clickAndCheckLog(browser, 'fileManager:getCurrentFile', 'README.txt', null, null)
  },
  'Should write to file #group2': async function (browser: NightwatchBrowser) {
    await clickAndCheckLog(browser, 'fileManager:writeFile', null, { event: 'fileSaved', args: ['README.txt'] }, ['README.txt', 'test'])
    browser.pause(4000, async () => {
      await clickAndCheckLog(browser, 'fileManager:getFile', 'test', null, 'README.txt')
    })
  },
  'Should set file #group2': async function (browser: NightwatchBrowser) {
    await clickAndCheckLog(browser, 'fileManager:setFile', null, { event: 'fileAdded', args: ['new.sol'] }, ['new.sol', 'test'])
    await clickAndCheckLog(browser, 'fileManager:readFile', 'test', null, 'new.sol')
  },
  'Should write to new file #group2': async function (browser: NightwatchBrowser) {
    await clickAndCheckLog(browser, 'fileManager:writeFile', null, { event: 'fileAdded', args: ['testing.txt'] }, ['testing.txt', 'test'])
    await clickAndCheckLog(browser, 'fileManager:readFile', 'test', null, 'testing.txt')
  },
  'Should rename file #group2': async function (browser: NightwatchBrowser) {
    await clickAndCheckLog(browser, 'fileManager:rename', null, null, ['testing.txt', 'testrename.txt'])
    await clickAndCheckLog(browser, 'fileManager:readFile', 'test', null, 'testrename.txt')
  },

  'Should create empty workspace #group2': async function (browser: NightwatchBrowser) {
    await clickAndCheckLog(browser, 'filePanel:createWorkspace', null, null, ['emptyworkspace', true])
    await clickAndCheckLog(browser, 'filePanel:getCurrentWorkspace', { name: 'emptyworkspace', isLocalhost: false, absolutePath: '.workspaces/emptyworkspace' }, null, null)
    await clickAndCheckLog(browser, 'fileManager:readdir', {}, null, '/')
  },
  'Should create workspace #group2': async function (browser: NightwatchBrowser) {
    await clickAndCheckLog(browser, 'filePanel:createWorkspace', null, null, 'testspace')
    await clickAndCheckLog(browser, 'filePanel:getCurrentWorkspace', { name: 'testspace', isLocalhost: false, absolutePath: '.workspaces/testspace' }, null, null)
    await clickAndCheckLog(browser, 'fileManager:readdir', {
      contracts: { isDirectory: true },
      scripts: { isDirectory: true },
      tests: { isDirectory: true },
      'README.txt': { isDirectory: false },
      '.prettierrc.json': { isDirectory: false }
    }, null, '/')
  },
  'Should get all workspaces #group2': async function (browser: NightwatchBrowser) {
    await clickAndCheckLog(browser, 'filePanel:getWorkspaces', [{name:"default_workspace",isGitRepo:false}, {name:"emptyworkspace",isGitRepo:false}, {name:"testspace",isGitRepo:false}], null, null)
  },
  'Should have set workspace event #group2': async function (browser: NightwatchBrowser) {
    await clickAndCheckLog(browser, 'filePanel:createWorkspace', null, { event: 'setWorkspace', args: [{ name: 'newspace', isLocalhost: false }] }, 'newspace')
  },
  'Should have event when switching workspace #group2': async function (browser: NightwatchBrowser) {
    // @ts-ignore
    browser.frameParent().useCss().clickLaunchIcon('filePanel').switchWorkspace('default_workspace').useXpath().click('//*[@data-id="verticalIconsKindlocalPlugin"]').frame(0, async () => {
      await clickAndCheckLog(browser, null, null, { event: 'setWorkspace', args: [{ name: 'default_workspace', isLocalhost: false }] }, null)
    })
  },

  'Should rename workspace #group2': async function (browser: NightwatchBrowser) {
    await clickAndCheckLog(browser, 'filePanel:renameWorkspace', null, null, ['default_workspace', 'renamed'])
    await clickAndCheckLog(browser, 'filePanel:getWorkspaces', [{name:"emptyworkspace",isGitRepo:false},{name:"testspace",isGitRepo:false},{name:"newspace",isGitRepo:false},{name:"renamed",isGitRepo:false}], null, null)
  },
  'Should delete workspace #group2': async function (browser: NightwatchBrowser) {
    await clickAndCheckLog(browser, 'filePanel:deleteWorkspace', null, null, ['testspace'])
    await clickAndCheckLog(browser, 'filePanel:getWorkspaces', [{name:"emptyworkspace",isGitRepo:false},{name:"newspace",isGitRepo:false},{name:"renamed",isGitRepo:false}], null, null)
  },
  // DGIT
  'Should have changes on new workspace #group3': async function (browser: NightwatchBrowser) {
    await clickAndCheckLog(browser, 'filePanel:createWorkspace', null, null, 'dgit')
    await clickAndCheckLog(browser, 'dGitProvider:status', [[".prettierrc.json",0,2,0], ["README.txt",0,2,0],["contracts/1_Storage.sol",0,2,0],["contracts/2_Owner.sol",0,2,0],["contracts/3_Ballot.sol",0,2,0],["scripts/deploy_with_ethers.ts",0,2,0],["scripts/deploy_with_web3.ts",0,2,0],["scripts/ethers-lib.ts",0,2,0],["scripts/web3-lib.ts",0,2,0],["tests/Ballot_test.sol",0,2,0],["tests/storage.test.js",0,2,0]], null, null)
  },

  'Should stage contract #group3': async function (browser: NightwatchBrowser) {
    await clickAndCheckLog(browser, 'dGitProvider:add', null, null, {
      filepath: 'contracts/1_Storage.sol'
    })
    await clickAndCheckLog(browser, 'dGitProvider:status', [[".prettierrc.json",0,2,0],["README.txt",0,2,0],["contracts/1_Storage.sol",0,2,2],["contracts/2_Owner.sol",0,2,0],["contracts/3_Ballot.sol",0,2,0],["scripts/deploy_with_ethers.ts",0,2,0],["scripts/deploy_with_web3.ts",0,2,0],["scripts/ethers-lib.ts",0,2,0],["scripts/web3-lib.ts",0,2,0],["tests/Ballot_test.sol",0,2,0],["tests/storage.test.js",0,2,0]], null, null)
  },
  'Should commit changes #group3': async function (browser: NightwatchBrowser) {
    await clickAndCheckLog(browser, 'dGitProvider:commit', null, null, { author: { name: 'Remix', email: 'Remix' }, message: 'commit-message' })
    await clickAndCheckLog(browser, 'dGitProvider:log', 'commit-message', null, null)
  },
  'Should have git log #group3': async function (browser: NightwatchBrowser) {
    await clickAndCheckLog(browser, 'dGitProvider:log', 'commit-message', null, null)
  },
  'Should have branches #group3': async function (browser: NightwatchBrowser) {
    await clickAndCheckLog(browser, 'dGitProvider:branches', [{ name: 'main' }], null, null)
  },
  // resolver
  'Should resolve url #group4': async function (browser: NightwatchBrowser) {
    await clickAndCheckLog(browser, 'contentImport:resolve', '# Remix Project', null, 'https://github.com/ethereum/remix-project/blob/master/README.md')
  },
  'Should resolve and save url #group4': async function (browser: NightwatchBrowser) {
    await clickAndCheckLog(browser, 'contentImport:resolveAndSave', '# Remix Project', { event: 'fileAdded', args: ['.deps/github/ethereum/remix-project/README.md'] }, 'https://github.com/ethereum/remix-project/blob/master/README.md')
  },
  // UNIT TESTING
  'Should activate solidityUnitTesting #group5': async function (browser: NightwatchBrowser) {
    await clickAndCheckLog(browser, 'manager:activatePlugin', null, null, 'solidityUnitTesting')
    browser.frameParent()
    assertPluginIsActive(browser, 'solidityUnitTesting', true)
    // @ts-ignore
    browser.frame(0)
    await clickAndCheckLog(browser, 'manager:isActive', true, null, 'solidityUnitTesting')
  },

  'Should test from path with solidityUnitTesting #group5': async function (browser: NightwatchBrowser) {
    await clickAndCheckLog(browser, 'solidityUnitTesting:testFromPath', '"totalPassing":2,"totalFailing":0', null, 'tests/Ballot_test.sol')
  },

  'Should deactivate solidityUnitTesting #group5': async function (browser: NightwatchBrowser) {
    await clickAndCheckLog(browser, 'manager:deactivatePlugin', null, null, 'solidityUnitTesting')
    browser.frameParent()
    assertPluginIsActive(browser, 'solidityUnitTesting', false)
    // @ts-ignore
    browser.frame(0)
    await clickAndCheckLog(browser, 'manager:isActive', false, null, 'solidityUnitTesting')
  },

  // COMPILER

  'Should compile a file #group6': async function (browser: NightwatchBrowser) {
    await clickAndCheckLog(browser, 'solidity:compile', null, null, 'contracts/1_Storage.sol')
    browser.pause(5000, async () => {
      await clickAndCheckLog(browser, 'solidity:compile', null, 'compilationFinished', null)
    })
  },

  'Should get compilationresults #group6': async function (browser: NightwatchBrowser) {
    await clickAndCheckLog(browser, 'solidity:getCompilationResult', 'contracts/1_Storage.sol', null, null)
  },

  // PROVIDER

  'Should switch to hardhat provider (provider plugin) #group8': function (browser: NightwatchBrowser) {
    browser
      .frameParent()
      .useCss()
      .clickLaunchIcon('pluginManager')
      .clickLaunchIcon('udapp')
      .switchEnvironment('hardhat-provider')
      .modalFooterOKClick('hardhat-provider')
      .waitForElementContainsText('*[data-id="settingsNetworkEnv"]', 'Custom') // e.g Custom (1337) network
      .clickLaunchIcon('localPlugin')
      .useXpath()
      // @ts-ignore
      .frame(0)
      .perform(async () => {
        const request = {
          id: 9999,
          jsonrpc: '2.0',
          method: 'net_listening',
          params: []
        }
        const result = '{"jsonrpc":"2.0","result":true,"id":9999}'
        await clickAndCheckLog(browser, 'hardhat-provider:sendAsync', result, null, request)
      })
  },

  // MODAL

  'Should open alerts from script #group9': function (browser: NightwatchBrowser) {
    browser
      .frameParent()
      .useCss()
      .addFile('test_modal.js', { content: testModalToasterApi })
      .executeScriptInTerminal('remix.execute(\'test_modal.js\')')
      .useCss()
      .waitForElementVisible('*[data-id="test_id_1_ModalDialogModalBody-react"]', 65000)
      .assert.containsText('*[data-id="test_id_1_ModalDialogModalBody-react"]', 'message 1')
      .modalFooterOKClick('test_id_1_')
      // check the script runner notifications
      .waitForElementVisible('*[data-id="test_id_2_ModalDialogModalBody-react"]')
      .assert.containsText('*[data-id="test_id_2_ModalDialogModalBody-react"]', 'message 2')
      .modalFooterOKClick('test_id_2_')
      .waitForElementVisible('*[data-id="test_id_3_ModalDialogModalBody-react"]')
      .modalFooterOKClick('test_id_3_')
      .journalLastChildIncludes('default value... ') // check the return value of the prompt
      .waitForElementVisible('*[data-shared="tooltipPopup"]')
      .waitForElementContainsText('*[data-shared="tooltipPopup"]', 'I am a toast')
      .waitForElementContainsText('*[data-shared="tooltipPopup"]', 'I am a re-toast')

  },
  'Should open 2 alerts from localplugin #group9': function (browser: NightwatchBrowser) {
    browser
      .clickLaunchIcon('localPlugin')
      .useXpath()
      // @ts-ignore
      .frame(0)
      .perform(async () => {
        await clickAndCheckLog(browser, 'notification:toast', null, null, 'message toast from local plugin', false) // create a toast on behalf of the localplugin
        await clickAndCheckLog(browser, 'notification:alert', null, null, { message: 'message from local plugin', id: 'test_id_1_local_plugin' }, false) // create an alert on behalf of the localplugin
      })
      .frameParent()
      .useCss()
      // check the local plugin notifications
      .waitForElementVisible('*[data-id="test_id_1_local_pluginModalDialogModalBody-react"]')
      .assert.containsText('*[data-id="test_id_1_local_pluginModalDialogModalBody-react"]', 'message from local plugin')
      .modalFooterOKClick('test_id_1_local_plugin')
      // check the toasters
      .waitForElementVisible('*[data-shared="tooltipPopup"]')
      .waitForElementContainsText('*[data-shared="tooltipPopup"]', 'message toast from local plugin')
  }
}

const testModalToasterApi = `
// Right click on the script name and hit "Run" to execute
(async () => {
 try {
    setTimeout(async () => {
      console.log('test .. ')
      remix.call('notification', 'alert', { message: 'message 1', id: 'test_id_1_' })
      remix.call('notification', 'toast', 'I am a toast')
      remix.call('notification', 'toast', 'I am a re-toast')
      remix.call('notification', 'alert', { message: 'message 2', id: 'test_id_2_' })

      const modalContent = {
        id: 'test_id_3_',
        title: 'test with input title',
        message: 'test with input content',
        modalType: 'prompt',
        okLabel: 'OK',
        cancelLabel: 'Cancel',
        defaultValue: 'default value... '
      }
      const result = await remix.call('notification', 'modal', modalContent)
      console.log(result)
    }, 500)
 } catch (e) {
    console.log(e.message)
 }
})()    `
