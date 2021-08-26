'use strict'
import { NightwatchBrowser } from 'nightwatch'
import init from '../helpers/init'

module.exports = {

  before: function (browser: NightwatchBrowser, done: VoidFunction) {
    init(browser, done)
  },

  '@sources': function () {
    return sources
  },

  'Should launch debugger': function (browser: NightwatchBrowser) {
    browser.addFile('blah.sol', sources[0]['blah.sol'])
      .clickLaunchIcon('udapp')
      .waitForElementPresent('*[title="Deploy - transact (not payable)"]', 65000)
      .click('*[title="Deploy - transact (not payable)"]')
      .debugTransaction(0)
      .waitForElementContainsText('*[data-id="sidePanelSwapitTitle"]', 'DEBUGGER', 60000)
  },

  'Should debug failing transaction': function (browser: NightwatchBrowser) {
    browser.waitForElementVisible('*[data-id="verticalIconsKindudapp"]')
      .clickLaunchIcon('udapp')
      .waitForElementPresent('*[data-id="universalDappUiTitleExpander"]')
      .click('*[data-id="universalDappUiTitleExpander"]')
      .scrollAndClick('*[title="string name, uint256 goal"]')
      .setValue('*[title="string name, uint256 goal"]', '"toast", 999')
      .click('*[data-id="createProject - transact (not payable)"]')
      .debugTransaction(1)
      .pause(2000)
      .scrollAndClick('*[data-id="solidityLocals"]')
      .waitForElementContainsText('*[data-id="solidityLocals"]', 'toast', 60000)
      .waitForElementContainsText('*[data-id="solidityLocals"]', '999', 60000)
  },

  'Should debug transaction using slider': function (browser: NightwatchBrowser) {
    browser.waitForElementVisible('*[data-id="verticalIconsKindudapp"]')
      .waitForElementVisible('*[data-id="slider"]')
      // eslint-disable-next-line dot-notation
      .execute(function () { document.getElementById('slider')['value'] = '50' }) // It only moves slider to 50 but vm traces are not updated
      .setValue('*[data-id="slider"]', new Array(1).fill(browser.Keys.RIGHT_ARROW))
      .pause(2000)
      .click('*[data-id="dropdownPanelSolidityLocals"]')
      .waitForElementContainsText('*[data-id="solidityLocals"]', 'no locals', 60000)
      .waitForElementContainsText('*[data-id="stepdetail"]', 'vm trace step:\n51', 60000)
  },

  'Should step back and forward transaction': function (browser: NightwatchBrowser) {
    browser.waitForElementVisible('*[data-id="verticalIconsKindudapp"]')
      .waitForElementPresent('*[data-id="buttonNavigatorIntoBack"]')
      .scrollAndClick('*[data-id="buttonNavigatorIntoBack"]')
      .pause(2000)
      .waitForElementContainsText('*[data-id="stepdetail"]', 'vm trace step:\n50', 60000)
      .waitForElementContainsText('*[data-id="stepdetail"]', 'execution step:\n50', 60000)
      .click('*[data-id="buttonNavigatorIntoForward"]')
      .pause(2000)
      .waitForElementContainsText('*[data-id="stepdetail"]', 'vm trace step:\n51', 60000)
      .waitForElementContainsText('*[data-id="stepdetail"]', 'execution step:\n51', 60000)
  },

  'Should jump through breakpoints': function (browser: NightwatchBrowser) {
    browser.waitForElementVisible('*[data-id="editorInput"]')
      .click('.ace_gutter-cell:nth-of-type(10)')
      .click('.ace_gutter-cell:nth-of-type(20)')
      .waitForElementVisible('*[data-id="buttonNavigatorJumpPreviousBreakpoint"]')
      .click('*[data-id="buttonNavigatorJumpPreviousBreakpoint"]')
      .pause(2000)
      .waitForElementContainsText('*[data-id="stepdetail"]', 'vm trace step:\n0', 60000)
      .waitForElementContainsText('*[data-id="stepdetail"]', 'execution step:\n0', 60000)
      .click('*[data-id="buttonNavigatorJumpNextBreakpoint"]')
      .pause(10000)
      .waitForElementContainsText('*[data-id="stepdetail"]', 'vm trace step:\n352', 60000)
      .waitForElementContainsText('*[data-id="stepdetail"]', 'execution step:\n352', 60000)
  },

  'Should display solidity imported code while debugging github import': function (browser: NightwatchBrowser) {
    browser
      .clickLaunchIcon('solidity')
      .testContracts('externalImport.sol', sources[1]['externalImport.sol'], ['ERC20'])
      .clickLaunchIcon('udapp')
      .waitForElementPresent('*[title="Deploy - transact (not payable)"]', 35000)
      .selectContract('ERC20')
      .createContract('"tokenName", "symbol"')
      .debugTransaction(2)
      .pause(2000)
      .waitForElementVisible('#stepdetail')
      .goToVMTraceStep(10)
      .getEditorValue((content) => {
        browser.assert.ok(content.indexOf(`constructor (string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }`) !== -1,
        'current displayed content is not from the ERC20 source code')
      })
  },

  'Should display correct source highlighting while debugging a contract which has ABIEncoderV2': function (browser: NightwatchBrowser) {
    /*
      localVariable_step266_ABIEncoder and localVariable_step717_ABIEncoder
      still contains unwanted values (related to decoding calldata types)
      This is still an issue @todo(https://github.com/ethereum/remix-project/issues/481), so this test will fail when this issue is fixed
    */
    browser
      .clickLaunchIcon('solidity')
      .setSolidityCompilerVersion('soljson-v0.6.12+commit.27d51765.js')
      .clickLaunchIcon('filePanel')
      .click('li[data-id="treeViewLitreeViewItemexternalImport.sol"')
      .testContracts('withABIEncoderV2.sol', sources[2]['withABIEncoderV2.sol'], ['test'])
      .clickLaunchIcon('udapp')
      .selectContract('test')
      .createContract('')
      .clickInstance(2)
      .clickFunction('test1 - transact (not payable)', { types: 'bytes userData', values: '0x000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000015b38da6a701c568545dcfcb03fcb875f56beddc4' })
      .debugTransaction(4)
      .pause(2000)
      .waitForElementVisible('#stepdetail')
      .goToVMTraceStep(261)
      .pause(1000)
    /*
      for the test below:
      source highlight should remain line `bytes32 idAsk = abi.decode(userData[:33], (bytes32));`
      At this vmtrace index, the sourcemap has file = -1 because the execution is in the generated sources (ABIEncoderV2)
      the atIndex of SourceLocationTracker was buggy and return an incorrect value, this is fixed
      But the debugger uses now validSourcelocation, which means file is not -1.
      In that case the source highlight at 261 should be the same as for step 262
    */
      .waitForElementPresent('.highlightLine7')
      .goToVMTraceStep(266)
      .pause(1000)
      .checkVariableDebug('soliditylocals', localVariable_step266_ABIEncoder) // locals should not be initiated at this point, only idAsk should
      .goToVMTraceStep(717)
      .pause(5000)
      .checkVariableDebug('soliditylocals', localVariable_step717_ABIEncoder) // all locals should be initiaed
      .clickLaunchIcon('udapp')
      .clickInstance(2)
  },

  'Should load more solidity locals array': function (browser: NightwatchBrowser) {
    browser
      .clickLaunchIcon('solidity')
      .testContracts('locals.sol', sources[3]['locals.sol'], ['testLocals'])
      .clickLaunchIcon('udapp')
      .waitForElementPresent('*[title="Deploy - transact (not payable)"]', 40000)
      .createContract('')
      .pause(2000)
      .clickInstance(3)
      .clickFunction('t - transact (not payable)')
      .pause(2000)
      .debugTransaction(6)
      .waitForElementVisible('*[data-id="slider"]')
      // .setValue('*[data-id="slider"]', '5000') // Like this, setValue doesn't work properly for input type = range
      // eslint-disable-next-line dot-notation
      .execute(function () { document.getElementById('slider')['value'] = '7450' }) // It only moves slider to 7450 but vm traces are not updated
      .setValue('*[data-id="slider"]', new Array(3).fill(browser.Keys.RIGHT_ARROW)) // This will press NEXT 3 times and will update the trace details
      .waitForElementPresent('*[data-id="treeViewDivtreeViewItemarray"]')
      .click('*[data-id="treeViewDivtreeViewItemarray"]')
      .waitForElementPresent('*[data-id="treeViewDivtreeViewLoadMore"]')
      .waitForElementContainsText('*[data-id="solidityLocals"]', '9: 9 uint256', 60000)
      .notContainsText('*[data-id="solidityLocals"]', '10: 10 uint256')
  },

  'Should debug using generated sources': function (browser: NightwatchBrowser) {
    browser
      .clickLaunchIcon('solidity')
      .pause(2000)
      .testContracts('withGeneratedSources.sol', sources[4]['withGeneratedSources.sol'], ['A'])
      .clickLaunchIcon('udapp')
      .createContract('')
      .clickInstance(4)
      .clickFunction('f - transact (not payable)', { types: 'uint256[] ', values: '[]' })
      .debugTransaction(8)
      .pause(2000)
      .click('*[data-id="debuggerTransactionStartButton"]') // stop debugging
      .click('*[data-id="debugGeneratedSourcesLabel"]') // select debug with generated sources
      .click('*[data-id="debuggerTransactionStartButton"]') // start debugging
      .pause(2000)
      .getEditorValue((content) => {
        browser.assert.ok(content.indexOf('if slt(sub(dataEnd, headStart), 32)') !== -1, 'current displayed content is not a generated source')
      })
      .click('*[data-id="debuggerTransactionStartButton"]')
  },

  'Should call the debugger api: getTrace': function (browser: NightwatchBrowser) {
    browser
      .addFile('test_jsGetTrace.js', { content: jsGetTrace })
      .executeScript('remix.exeCurrent()')
      .waitForElementContainsText('*[data-id="terminalJournal"]', 'result { "gas": "0x575f", "return": "0x0000000000000000000000000000000000000000000000000000000000000000", "structLogs":', 60000)
  },

  'Should call the debugger api: debug': function (browser: NightwatchBrowser) {
    browser
      .addFile('test_jsDebug.js', { content: jsDebug })
      .executeScript('remix.exeCurrent()')
      .pause(3000)
      .clickLaunchIcon('debugger')
      .waitForElementVisible('*[data-id="slider"]')
      // eslint-disable-next-line dot-notation
      .execute(function () { document.getElementById('slider')['value'] = '153' }) // It only moves slider to 153 but vm traces are not updated
      .setValue('*[data-id="slider"]', new Array(1).fill(browser.Keys.RIGHT_ARROW))
      .pause(1000)
    /*
      setting the slider to 5 leads to "vm trace step: 91" for chrome and "vm trace step: 92" for firefox
      => There is something going wrong with the nightwatch API here.
      As we are only testing if debugger is active, this is ok to keep that for now.
    */
      .waitForElementContainsText('*[data-id="stepdetail"]', 'vm trace step:\n154', 60000)
  },

  'Should start debugging using remix debug nodes (rinkeby)': '' + function (browser: NightwatchBrowser) {
    browser
      .clickLaunchIcon('solidity')
      .setSolidityCompilerVersion('soljson-v0.8.7+commit.e28d00a7.js')
      .addFile('useDebugNodes.sol', sources[5]['useDebugNodes.sol']) // compile contract
      .clickLaunchIcon('udapp')
      .click('*[data-id="settingsWeb3Mode"]') // select web3 provider with debug nodes URL
      .clearValue('*[data-id="modalDialogCustomPromptText"]')
      .setValue('*[data-id="modalDialogCustomPromptText"]', 'https://remix-rinkeby.ethdevops.io')
      .modalFooterOKClick()
      .waitForElementPresent('*[title="Deploy - transact (not payable)"]', 65000) // wait for the compilation to succeed
      .clickLaunchIcon('debugger')
      .clearValue('*[data-id="debuggerTransactionInput"]')
      .setValue('*[data-id="debuggerTransactionInput"]', '0x156dbf7d0f9b435dd900cfc8f3264d523dd25733418ddbea1ce53e294f421013')
      .click('*[data-id="debugGeneratedSourcesLabel"]') // unselect debug with generated sources
      .click('*[data-id="debuggerTransactionStartButton"]')
      .waitForElementVisible('*[data-id="solidityLocals"]', 60000)
      .pause(10000)
      .checkVariableDebug('soliditylocals', { num: { value: '2', type: 'uint256' } })
      .checkVariableDebug('soliditystate', { number: { value: '0', type: 'uint256', constant: false, immutable: false } })
      .end()
  }
}

const sources = [
  {
    'blah.sol': {
      content: `
    pragma solidity >=0.7.0 <0.9.0;
 
    contract Kickstarter {

        enum State { Started, Completed }

        struct Project {
            address owner;
            string name;
            uint goal;
            State state;
        }    

        Project[] public projects;    

        constructor() {

        }

        function createProject(string memory name, uint goal) public {
            Project storage project = projects[projects.length];
            project.name = name;
            project.owner = msg.sender;
            project.state = State.Started;
            project.goal = goal;
        }
    } 
        `
    }
  },
  {
    'externalImport.sol': { content: 'import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/release-v4.1/contracts/token/ERC20/ERC20.sol"; contract test7 {}' }
  },
  {
    'withABIEncoderV2.sol': {
      content: `
    pragma experimental ABIEncoderV2;

    contract test {
    // 000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000015b38da6a701c568545dcfcb03fcb875f56beddc4
    // 0000000000000000000000000000000000000000000000000000000000000002
    function test1 (bytes calldata userData) external returns (bytes memory, bytes32, bytes32, uint) {
        bytes32 idAsk = abi.decode(userData[:33], (bytes32));
        bytes32 idOffer = abi.decode(userData[32:64], (bytes32));
              
        bytes memory ro  = abi.encodePacked(msg.sender, msg.sender, idAsk, idOffer);
        return (ro, idAsk, idOffer, userData.length);
    }
    
    
    function testgp (bytes calldata userData) external returns (bytes4) {
        return  abi.decode(userData[:4], (bytes4));
    }
}
    `
    }
  },
  {
    'locals.sol': {
      content: `
      pragma solidity ^0.8.0;
      contract testLocals {
        function t () public {
            uint[] memory array = new uint[](150);
            for (uint k = 0; k < 150; k++) {
                array[k] = k;
            }
        }
      }
        `
    }
  },
  {
    'withGeneratedSources.sol': {
      content: `
      // SPDX-License-Identifier: GPL-3.0
      pragma experimental ABIEncoderV2; 
      contract A { 
        function f(uint[] memory) public returns (uint256) { } 
      }
      `
    }
  },
  {
    'useDebugNodes.sol': {
      content: `
      // SPDX-License-Identifier: GPL-3.0

      pragma solidity >=0.7.0 <0.9.0;

      /**
       * @title Storage
       * @dev Store & retrieve value in a variable
       */
      contract Storage {

          uint256 number;

          /**
           * @dev Store value in variable
           * @param num value to store
           */
          function store(uint256 num) public {
              number = num;
          }

          /**
           * @dev Return value 
           * @return value of 'number'
           */
          function retrieve() public view returns (uint256){
              return number;
          }
      }
      `
    }
  }
]

const localVariable_step266_ABIEncoder = { // eslint-disable-line
  '<1>': {
    length: '0xNaN',
    type: 'bytes',
    value: '0x'
  },
  '<2>': {
    type: 'bytes32',
    value: '0x0000000000000000000000000000000000000000000000000000000000000000'
  },
  '<3>': {
    type: 'bytes32',
    value: '0x0000000000000000000000000000000000000000000000000000000000000000'
  },
  '<4>': {
    type: 'uint256',
    value: '0'
  },
  idAsk: {
    type: 'bytes32',
    value: '0x0000000000000000000000000000000000000000000000000000000000000002'
  },
  userData: {
    value: '0x000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000015b38da6a701c568545dcfcb03fcb875f56beddc4',
    type: 'bytes'
  }
}

const localVariable_step717_ABIEncoder = { // eslint-disable-line
  '<1>': {
    length: '0xd0',
    type: 'bytes',
    value: '0x5b38da6a701c568545dcfcb03fcb875f56beddc45b38da6a701c568545dcfcb03fcb875f56beddc400000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001'
  },
  '<2>': {
    type: 'bytes32',
    value: '0x0000000000000000000000000000000000000000000000000000000000000002'
  },
  '<3>': {
    type: 'bytes32',
    value: '0x0000000000000000000000000000000000000000000000000000000000000001'
  },
  '<4>': {
    type: 'uint256',
    value: '84'
  },
  idAsk: {
    type: 'bytes32',
    value: '0x0000000000000000000000000000000000000000000000000000000000000002'
  },
  idOffer: {
    type: 'bytes32',
    value: '0x0000000000000000000000000000000000000000000000000000000000000001'
  },
  ro: {
    length: '0xd0',
    type: 'bytes',
    value: '0x5b38da6a701c568545dcfcb03fcb875f56beddc45b38da6a701c568545dcfcb03fcb875f56beddc400000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001'
  },
  userData: {
    value: '0x000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000015b38da6a701c568545dcfcb03fcb875f56beddc4',
    type: 'bytes'
  }
}

const jsGetTrace = `(async () => {
  try {
      const result = await remix.call('debugger', 'getTrace', '0x9341be49e911afe99bf1abc67cbcf36739d2e6470a08a69511c205a0737d7332')
      console.log('result ', result)
  } catch (e) {
      console.log(e.message)
  }
})()`

const jsDebug = `(async () => {    
  try {
      const result = await remix.call('debugger', 'debug', '0x9341be49e911afe99bf1abc67cbcf36739d2e6470a08a69511c205a0737d7332')
      console.log('result ', result)
  } catch (e) {
      console.log(e.message)
  }
})()`
