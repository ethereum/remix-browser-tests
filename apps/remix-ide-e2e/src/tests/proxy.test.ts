'use strict'
import { NightwatchBrowser } from 'nightwatch'
import init from '../helpers/init'

let firstProxyAddress: string
let lastProxyAddress: string
module.exports = {
  before: function (browser: NightwatchBrowser, done: VoidFunction) {
    init(browser, done)
  },

  '@sources': function () {
    return sources
  },

  'Should show deploy proxy option for UUPS upgradeable contract': function (browser: NightwatchBrowser) {
    browser
      .addFile('myTokenV1.sol', sources[0]['myTokenV1.sol'])
      .clickLaunchIcon('solidity')
      .pause(2000)
      .click('[data-id="compilerContainerCompileBtn"]')
      .waitForElementPresent('select[id="compiledContracts"] option[value=MyToken]', 60000)
      .clickLaunchIcon('udapp')
      .click('select.udapp_contractNames')
      .click('select.udapp_contractNames option[value=MyToken]')
      .waitForElementPresent('[data-id="contractGUIDeployWithProxyLabel"]')
      .waitForElementPresent('[data-id="contractGUIUpgradeImplementationLabel"]')
  },

  'Should show upgrade proxy option for child contract inheriting UUPS parent contract': function (browser: NightwatchBrowser) {
    browser
      .addFile('myTokenV2.sol', sources[1]['myTokenV2.sol'])
      .clickLaunchIcon('solidity')
      .pause(2000)
      .click('[data-id="compilerContainerCompileBtn"]')
      .waitForElementPresent('select[id="compiledContracts"] option[value=MyTokenV2]', 60000)
      .clickLaunchIcon('udapp')
      .click('select.udapp_contractNames')
      .click('select.udapp_contractNames option[value=MyTokenV2]')
      .waitForElementPresent('[data-id="contractGUIDeployWithProxyLabel"]')
      .waitForElementPresent('[data-id="contractGUIUpgradeImplementationLabel"]')
  },

  'Should deploy proxy without initialize parameters': function (browser: NightwatchBrowser) {
    browser
      .openFile('myTokenV1.sol')
      .clickLaunchIcon('solidity')
      .pause(2000)
      .click('[data-id="compilerContainerCompileBtn"]')
      .waitForElementPresent('select[id="compiledContracts"] option[value=MyToken]', 60000)
      .clickLaunchIcon('udapp')
      .click('select.udapp_contractNames')
      .click('select.udapp_contractNames option[value=MyToken]')
      .waitForElementPresent('[data-id="contractGUIDeployWithProxyLabel"]')
      .click('[data-id="contractGUIDeployWithProxyLabel"]')
      .createContract('')
      .waitForElementContainsText('[data-id="udappNotifyModalDialogModalTitle-react"]', 'Deploy Implementation & Proxy (ERC1967)')
      .waitForElementVisible('[data-id="udappNotify-modal-footer-ok-react"]')
      .click('[data-id="udappNotify-modal-footer-ok-react"]')
      .waitForElementContainsText('[data-id="confirmProxyDeploymentModalDialogModalTitle-react"]', 'Confirm Deploy Proxy (ERC1967)')
      .waitForElementVisible('[data-id="confirmProxyDeployment-modal-footer-ok-react"]')
      .click('[data-id="confirmProxyDeployment-modal-footer-ok-react"]')
      .waitForElementPresent('[data-id="universalDappUiTitleExpander0"]')
      .waitForElementPresent('[data-id="universalDappUiTitleExpander1"]')
  },

  'Should interact with deployed contract via ERC1967 (proxy)': function (browser: NightwatchBrowser) {
    browser
      .getAddressAtPosition(1, (address) => {
        firstProxyAddress = address
      })
      .clickInstance(1)
      .perform((done) => {
        browser.testConstantFunction(firstProxyAddress, 'name - call', null, '0:\nstring: MyToken').perform(() => {
          done()
        })
      })
      .perform((done) => {
        browser.testConstantFunction(firstProxyAddress, 'symbol - call', null, '0:\nstring: MTK').perform(() => {
          done()
        })
      })
  },

  'Should deploy proxy with initialize parameters': function (browser: NightwatchBrowser) {
    browser
      .waitForElementPresent('[data-id="deployAndRunClearInstances"]')
      .click('[data-id="deployAndRunClearInstances"]')
      .addFile('initializeProxy.sol', sources[2]['initializeProxy.sol'])
      .clickLaunchIcon('solidity')
      .pause(2000)
      .click('[data-id="compilerContainerCompileBtn"]')
      .waitForElementPresent('select[id="compiledContracts"] option[value=MyInitializedToken]', 60000)
      .clickLaunchIcon('udapp')
      .click('select.udapp_contractNames')
      .click('select.udapp_contractNames option[value=MyInitializedToken]')
      .waitForElementPresent('[data-id="contractGUIDeployWithProxyLabel"]')
      .click('[data-id="contractGUIDeployWithProxyLabel"]')
      .waitForElementPresent('input[title="tokenName"]')
      .waitForElementPresent('input[title="tokenSymbol"]')
      .setValue('input[title="tokenName"]', 'Remix')
      .setValue('input[title="tokenSymbol"]', "R")
      .createContract('')
      .waitForElementContainsText('[data-id="udappNotifyModalDialogModalTitle-react"]', 'Deploy Implementation & Proxy (ERC1967)')
      .waitForElementVisible('[data-id="udappNotify-modal-footer-ok-react"]')
      .click('[data-id="udappNotify-modal-footer-ok-react"]')
      .waitForElementContainsText('[data-id="confirmProxyDeploymentModalDialogModalTitle-react"]', 'Confirm Deploy Proxy (ERC1967)')
      .waitForElementVisible('[data-id="confirmProxyDeployment-modal-footer-ok-react"]')
      .click('[data-id="confirmProxyDeployment-modal-footer-ok-react"]')
      .waitForElementPresent('[data-id="universalDappUiTitleExpander0"]')
      .waitForElementPresent('[data-id="universalDappUiTitleExpander1"]')
  },

  'Should interact with initialized contract to verify parameters': function (browser: NightwatchBrowser) {
    browser
      .getAddressAtPosition(1, (address) => {
        lastProxyAddress = address
      })
      .clickInstance(1)
      .perform((done) => {
        browser.testConstantFunction(lastProxyAddress, 'name - call', null, '0:\nstring: Remix').perform(() => {
          done()
        })
      })
      .perform((done) => {
        browser.testConstantFunction(lastProxyAddress, 'symbol - call', null, '0:\nstring: R').perform(() => {
          done()
        })
      })
  },

  'Should upgrade contract using last deployed proxy address (MyTokenV1 to MyTokenV2)': function (browser: NightwatchBrowser) {
    browser
      .waitForElementPresent('[data-id="deployAndRunClearInstances"]')
      .click('[data-id="deployAndRunClearInstances"]')
      .openFile('myTokenV2.sol')
      .clickLaunchIcon('solidity')
      .pause(2000)
      .click('[data-id="compilerContainerCompileBtn"]')
      .waitForElementPresent('select[id="compiledContracts"] option[value=MyTokenV2]', 60000)
      .clickLaunchIcon('udapp')
      .click('select.udapp_contractNames')
      .click('select.udapp_contractNames option[value=MyTokenV2]')
      .waitForElementPresent('[data-id="contractGUIUpgradeImplementationLabel"]')
      .click('[data-id="contractGUIUpgradeImplementationLabel"]')
      .waitForElementPresent('[data-id="contractGUIProxyAddressLabel"]')
      .click('[data-id="contractGUIProxyAddressLabel"]')
      .waitForElementPresent('[data-id="lastDeployedERC1967Address"]')
      .assert.containsText('[data-id="lastDeployedERC1967Address"]', lastProxyAddress)
      .createContract('')
      .waitForElementContainsText('[data-id="udappNotifyModalDialogModalTitle-react"]', 'Deploy Implementation & Update Proxy')
      .waitForElementVisible('[data-id="udappNotify-modal-footer-ok-react"]')
      .click('[data-id="udappNotify-modal-footer-ok-react"]')
      .waitForElementContainsText('[data-id="confirmProxyDeploymentModalDialogModalTitle-react"]', 'Confirm Update Proxy (ERC1967)')
      .waitForElementVisible('[data-id="confirmProxyDeployment-modal-footer-ok-react"]')
      .click('[data-id="confirmProxyDeployment-modal-footer-ok-react"]')
      .waitForElementPresent('[data-id="universalDappUiTitleExpander0"]')
      .waitForElementPresent('[data-id="universalDappUiTitleExpander1"]')
  },

  'Should interact with upgraded function in contract MyTokenV2': function (browser: NightwatchBrowser) {
    browser
      .clickInstance(1)
      .perform((done) => {
        browser.testConstantFunction(lastProxyAddress, 'version - call', null, '0:\nstring: MyTokenV2!').perform(() => {
          done()
        })
      })
  },

  'Should upgrade contract by providing proxy address in input field (MyTokenV1 to MyTokenV2)': function (browser: NightwatchBrowser) {
    browser
      .waitForElementPresent('[data-id="deployAndRunClearInstances"]')
      .click('[data-id="deployAndRunClearInstances"]')
      .openFile('myTokenV2.sol')
      .clickLaunchIcon('solidity')
      .pause(2000)
      .click('[data-id="compilerContainerCompileBtn"]')
      .waitForElementPresent('select[id="compiledContracts"] option[value=MyTokenV2]', 60000)
      .clickLaunchIcon('udapp')
      .click('select.udapp_contractNames')
      .click('select.udapp_contractNames option[value=MyTokenV2]')
      .waitForElementPresent('[data-id="contractGUIUpgradeImplementationLabel"]')
      .click('[data-id="contractGUIUpgradeImplementationLabel"]')
      .waitForElementPresent('[data-id="contractGUIProxyAddressLabel"]')
      .click('[data-id="contractGUIProxyAddressLabel"]')
      .waitForElementPresent('[data-id="ERC1967AddressInput"]')
      .setValue('[data-id="ERC1967AddressInput"]', firstProxyAddress)
      .createContract('')
      .waitForElementContainsText('[data-id="udappNotifyModalDialogModalTitle-react"]', 'Deploy Implementation & Update Proxy')
      .waitForElementVisible('[data-id="udappNotify-modal-footer-ok-react"]')
      .click('[data-id="udappNotify-modal-footer-ok-react"]')
      .waitForElementContainsText('[data-id="confirmProxyDeploymentModalDialogModalTitle-react"]', 'Confirm Update Proxy (ERC1967)')
      .waitForElementVisible('[data-id="confirmProxyDeployment-modal-footer-ok-react"]')
      .click('[data-id="confirmProxyDeployment-modal-footer-ok-react"]')
      .waitForElementPresent('[data-id="universalDappUiTitleExpander0"]')
      .waitForElementPresent('[data-id="universalDappUiTitleExpander1"]')
  },

  'Should interact with upgraded contract through provided proxy address': function (browser: NightwatchBrowser) {
    browser
      .clickInstance(1)
      .perform((done) => {
        browser.testConstantFunction(firstProxyAddress, 'version - call', null, '0:\nstring: MyTokenV2!').perform(() => {
          done()
        })
      })
      .end()
  }
}

const sources = [
  {
    'myTokenV1.sol': {
      content: `
      // SPDX-License-Identifier: MIT
      pragma solidity ^0.8.4;
      
      import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
      import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
      import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
      import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
      
      contract MyToken is Initializable, ERC721Upgradeable, OwnableUpgradeable, UUPSUpgradeable {
          /// @custom:oz-upgrades-unsafe-allow constructor
          constructor() {
              _disableInitializers();
          }
      
          function initialize() initializer public {
              __ERC721_init("MyToken", "MTK");
              __Ownable_init();
              __UUPSUpgradeable_init();
          }
      
          function _authorizeUpgrade(address newImplementation)
              internal
              onlyOwner
              override
          {}
      }
        `
    }
  }, {
    'myTokenV2.sol': {
      content: `
      import "./myTokenV1.sol";

      contract MyTokenV2 is MyToken {
        function version () public view returns (string memory) {
            return "MyTokenV2!";
        }
    }
      `
    }
  }, {
    'initializeProxy.sol': {
      content: `
      // SPDX-License-Identifier: MIT
      pragma solidity ^0.8.4;
      
      import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
      import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
      import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
      import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
      
      contract MyInitializedToken is Initializable, ERC721Upgradeable, OwnableUpgradeable, UUPSUpgradeable {
          /// @custom:oz-upgrades-unsafe-allow constructor
          constructor() {
              _disableInitializers();
          }
      
          function initialize(string memory tokenName, string memory tokenSymbol) initializer public {
              __ERC721_init(tokenName, tokenSymbol);
              __Ownable_init();
              __UUPSUpgradeable_init();
          }
      
          function _authorizeUpgrade(address newImplementation)
              internal
              onlyOwner
              override
          {}
      }
        `
    }
  }
]