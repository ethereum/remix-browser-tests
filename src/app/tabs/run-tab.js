'use strict'
var $ = require('jquery')
var yo = require('yo-yo')
var remixLib = require('remix-lib')
var ethJSUtil = require('ethereumjs-util')
var csjs = require('csjs-inject')
var txExecution = remixLib.execution.txExecution
var txFormat = remixLib.execution.txFormat
var txHelper = remixLib.execution.txHelper
var EventManager = remixLib.EventManager
var globlalRegistry = require('../../global/registry')
var helper = require('../../lib/helper.js')
var executionContext = require('../../execution-context')
var modalDialogCustom = require('../ui/modal-dialog-custom')
var copyToClipboard = require('../ui/copy-to-clipboard')
const Buffer = require('safe-buffer').Buffer
var Personal = require('web3-eth-personal')
var Card = require('../ui/card')
var Recorder = require('../../recorder')
var addTooltip = require('../ui/tooltip')
var css = require('./styles/run-tab-styles')
var MultiParamManager = require('../../multiParamManager')
var modalDialog = require('../ui/modaldialog')

function runTab (opts, localRegistry) {
  /* -------------------------
            VARIABLES
  --------------------------- */
  var self = this
  self.event = new EventManager()
  self._view = {}
  self.data = {
    count: 0,
    text: `All transactions (deployed contracts and function executions)
    in this environment can be saved and replayed in
    another environment. e.g Transactions created in
    Javascript VM can be replayed in the Injected Web3.`
  }
  self._components = {}
  self._components.registry = localRegistry || globlalRegistry
  self._components.transactionContextAPI = {
    getAddress: (cb) => {
      cb(null, $('#txorigin').val())
    },
    getValue: (cb) => {
      try {
        var number = document.querySelector('#value').value
        var select = document.getElementById('unit')
        var index = select.selectedIndex
        var selectedUnit = select.querySelectorAll('option')[index].dataset.unit
        var unit = 'ether' // default
        if (selectedUnit === 'ether') {
          unit = 'ether'
        } else if (selectedUnit === 'finney') {
          unit = 'finney'
        } else if (selectedUnit === 'gwei') {
          unit = 'gwei'
        } else if (selectedUnit === 'wei') {
          unit = 'wei'
        }
        cb(null, executionContext.web3().toWei(number, unit))
      } catch (e) {
        cb(e)
      }
    },
    getGasLimit: (cb) => {
      cb(null, $('#gasLimit').val())
    }
  }
  // dependencies
  self._deps = {
    compiler: self._components.registry.get('compiler').api,
    udapp: self._components.registry.get('udapp').api,
    udappUI: self._components.registry.get('udappUI').api,
    config: self._components.registry.get('config').api,
    fileManager: self._components.registry.get('filemanager').api,
    editor: self._components.registry.get('editor').api,
    logCallback: self._components.registry.get('logCallback').api,
    filePanel: self._components.registry.get('filepanel').api
  }
  self._deps.udapp.resetAPI(self._components.transactionContextAPI)
  self._view.recorderCount = yo`<span>0</span>`
  self._view.instanceContainer = yo`<div class="${css.instanceContainer}"></div>`
  self._view.clearInstanceElement = yo`
    <i class="${css.clearinstance} ${css.icon} fa fa-trash" onclick=${() => self.event.trigger('clearInstance', [])}
    title="Clear instances list and reset recorder" aria-hidden="true">
  </i>`
  self._view.instanceContainerTitle = yo`
    <div class=${css.instanceContainerTitle}
      title="Autogenerated generic user interfaces for interaction with deployed contracts">
      Deployed Contracts
      ${self._view.clearInstanceElement}
    </div>`
  self._view.noInstancesText = yo`
    <div class="${css.noInstancesText}">
      Currently you have no contract instances to interact with.
    </div>`

  var container = yo`<div class="${css.runTabView}" id="runTabView" ></div>`
  var recorderInterface = makeRecorder(localRegistry, self.event, self)

  self._view.collapsedView = yo`
    <div class=${css.recorderCollapsedView}>
      <div class=${css.recorderCount}>${self._view.recorderCount}</div>
    </div>`

  self._view.expandedView = yo`
    <div class=${css.recorderExpandedView}>
      <div class=${css.recorderDescription}>
        ${self.data.text}
      </div>
      <div class="${css.transactionActions}">
        ${recorderInterface.recordButton}
        ${recorderInterface.runButton}
        </div>
      </div>
    </div>`

  self.recorderOpts = {
    title: 'Transactions recorded:',
    collapsedView: self._view.collapsedView
  }

  var recorderCard = new Card({}, {}, self.recorderOpts)
  recorderCard.event.register('expandCollapseCard', (arrow, body, status) => {
    body.innerHTML = ''
    status.innerHTML = ''
    if (arrow === 'down') {
      status.appendChild(self._view.collapsedView)
      body.appendChild(self._view.expandedView)
    } else if (arrow === 'up') {
      status.appendChild(self._view.collapsedView)
    }
  })
  /* -------------------------
       MAIN HTML ELEMENT
  --------------------------- */
  var el = yo`
  <div>
    ${settings(container, self)}
    ${contractDropdown(self.event, self)}
    ${recorderCard.render()}
    ${self._view.instanceContainer}
  </div>
  `
  container.appendChild(el)

  return { render () { return container } }
}

var accountListCallId = 0
var loadedAccounts = {}
function fillAccountsList (container, self) {
  accountListCallId++
  (function (callid) {
    var txOrigin = container.querySelector('#txorigin')
    self._deps.udapp.getAccounts((err, accounts) => {
      if (accountListCallId > callid) return
      accountListCallId++
      if (err) { addTooltip(`Cannot get account list: ${err}`) }
      for (var loadedaddress in loadedAccounts) {
        if (accounts.indexOf(loadedaddress) === -1) {
          txOrigin.removeChild(txOrigin.querySelector('option[value="' + loadedaddress + '"]'))
          delete loadedAccounts[loadedaddress]
        }
      }
      for (var i in accounts) {
        var address = accounts[i]
        if (!loadedAccounts[address]) {
          txOrigin.appendChild(yo`<option value="${address}" >${address}</option>`)
          loadedAccounts[address] = 1
        }
      }
      txOrigin.setAttribute('value', accounts[0])
    })
  })(accountListCallId)
}

function updateAccountBalances (container, self) {
  var accounts = $(container.querySelector('#txorigin')).children('option')
  accounts.each(function (index, value) {
    (function (acc) {
      self._deps.udapp.getBalanceInEther(accounts[acc].value, function (err, res) {
        if (!err) {
          accounts[acc].innerText = helper.shortenAddress(accounts[acc].value, res)
        }
      })
    })(index)
  })
}

/* ------------------------------------------------
           RECORDER
------------------------------------------------ */
function makeRecorder (registry, runTabEvent, self) {
  var recorder = new Recorder(self._deps.compiler, self._deps.udapp, self._deps.logCallback)

  recorder.event.register('newTxRecorded', (count) => {
    self.data.count = count
    self._view.recorderCount.innerText = count
  })
  recorder.event.register('cleared', () => {
    self.data.count = 0
    self._view.recorderCount.innerText = 0
  })

  executionContext.event.register('contextChanged', () => {
    recorder.clearAll()
  })

  runTabEvent.register('clearInstance', () => {
    recorder.clearAll()
  })

  var css2 = csjs`
    .container {}
    .runTxs {}
    .recorder {}
  `

  var runButton = yo`<i class="fa fa-play runtransaction ${css2.runTxs} ${css.icon}"  title="Run Transactions" aria-hidden="true"></i>`
  var recordButton = yo`
    <i class="fa fa-floppy-o savetransaction ${css2.recorder} ${css.icon}"
      onclick=${triggerRecordButton} title="Save Transactions" aria-hidden="true">
    </i>`

  function triggerRecordButton () {
    var txJSON = JSON.stringify(recorder.getAll(), null, 2)
    var fileManager = self._deps.fileManager
    var path = fileManager.currentPath()
    modalDialogCustom.prompt(null, 'Transactions will be saved in a file under ' + path, 'scenario.json', input => {
      var fileProvider = fileManager.fileProviderOf(path)
      if (fileProvider) {
        var newFile = path + '/' + input
        helper.createNonClashingName(newFile, fileProvider, (error, newFile) => {
          if (error) return modalDialogCustom.alert('Failed to create file. ' + newFile + ' ' + error)
          if (!fileProvider.set(newFile, txJSON)) {
            modalDialogCustom.alert('Failed to create file ' + newFile)
          } else {
            fileManager.switchFile(newFile)
          }
        })
      }
    })
  }

  runButton.onclick = () => {
    /*
    @TODO
    update account address in scenario.json
    popup if scenario.json not open - "Open a file with transactions you want to replay and click play again"
    */
    var currentFile = self._deps.config.get('currentFile')
    self._deps.fileManager.fileProviderOf(currentFile).get(currentFile, (error, json) => {
      if (error) {
        modalDialogCustom.alert('Invalid Scenario File ' + error)
      } else {
        if (currentFile.match('.json$')) {
          try {
            var obj = JSON.parse(json)
            var txArray = obj.transactions || []
            var accounts = obj.accounts || []
            var options = obj.options || {}
            var abis = obj.abis || {}
            var linkReferences = obj.linkReferences || {}
          } catch (e) {
            return modalDialogCustom.alert('Invalid Scenario File, please try again')
          }
          if (txArray.length) {
            var noInstancesText = self._view.noInstancesText
            if (noInstancesText.parentNode) { noInstancesText.parentNode.removeChild(noInstancesText) }
            recorder.run(txArray, accounts, options, abis, linkReferences, self._deps.udapp, (abi, address, contractName) => {
              self._view.instanceContainer.appendChild(self._deps.udappUI.renderInstanceFromABI(abi, address, contractName))
            })
          }
        } else {
          modalDialogCustom.alert('A scenario file is required. Please make sure a scenario file is currently displayed in the editor. The file must be of type JSON. Use the "Save Transactions" Button to generate a new Scenario File.')
        }
      }
    })
  }

  return { recordButton, runButton }
}
/* ------------------------------------------------
    CONTRACT (deploy or access deployed)
------------------------------------------------ */

function contractDropdown (events, self) {
  var instanceContainer = self._view.instanceContainer
  var instanceContainerTitle = self._view.instanceContainerTitle
  instanceContainer.appendChild(instanceContainerTitle)
  instanceContainer.appendChild(self._view.noInstancesText)
  var compFails = yo`<i title="Contract compilation failed. Please check the compile tab for more information." class="fa fa-times-circle ${css.errorIcon}" ></i>`
  var info = yo`<i class="fa fa-question-circle-o ${css.infoDeployAction}" aria-hidden="true" title="*.sol files allows deploying and accessing contracts. *.abi files only allows accessing contracts."></i>`
  self._deps.compiler.event.register('compilationFinished', function (success, data, source) {
    getContractNames(success, data)
    if (success) {
      compFails.style.display = 'none'
      document.querySelector(`.${css.contractNames}`).classList.remove(css.contractNamesError)
    } else {
      compFails.style.display = 'block'
      document.querySelector(`.${css.contractNames}`).classList.add(css.contractNamesError)
    }
  })

  var deployAction = (value) => {
    self._view.createPanel.style.display = value
    self._view.orLabel.style.display = value
  }

  self._deps.fileManager.event.register('currentFileChanged', (currentFile) => {
    document.querySelector(`.${css.contractNames}`).classList.remove(css.contractNamesError)
    var contractNames = document.querySelector(`.${css.contractNames.classNames[0]}`)
    contractNames.innerHTML = ''
    if (/.(.abi)$/.exec(currentFile)) {
      deployAction('none')
      compFails.style.display = 'none'
      contractNames.appendChild(yo`<option>(abi)</option>`)
      selectContractNames.setAttribute('disabled', true)
    } else if (/.(.sol)$/.exec(currentFile)) {
      deployAction('block')
    }
  })

  var atAddressButtonInput = yo`<input class="${css.input} ataddressinput" placeholder="Load contract from Address" title="atAddress" />`
  var selectContractNames = yo`<select class="${css.contractNames}" disabled></select>`

  function getSelectedContract () {
    var contractName = selectContractNames.children[selectContractNames.selectedIndex].innerHTML
    if (contractName) {
      return {
        name: contractName,
        contract: self._deps.compiler.getContract(contractName)
      }
    }
    return null
  }

  self._view.createPanel = yo`<div class="${css.button}"></div>`
  self._view.orLabel = yo`<div class="${css.orLabel}">or</div>`
  var el = yo`
    <div class="${css.container}">
      <div class="${css.subcontainer}">
        ${selectContractNames} ${compFails} ${info}
      </div>
      <div class="${css.buttons}">
        ${self._view.createPanel}
        ${self._view.orLabel}
        <div class="${css.button} ${css.atAddressSect}">
          <div class="${css.atAddress}" onclick=${function () { loadFromAddress() }}>At Address</div>
          ${atAddressButtonInput}
        </div>
      </div>
    </div>
  `

  function setInputParamsPlaceHolder () {
    self._view.createPanel.innerHTML = ''
    if (self._deps.compiler.getContract && selectContractNames.selectedIndex >= 0 && selectContractNames.children.length > 0) {
      var ctrabi = txHelper.getConstructorInterface(getSelectedContract().contract.object.abi)
      var ctrEVMbc = getSelectedContract().contract.object.evm.bytecode.object
      var createConstructorInstance = new MultiParamManager(0, ctrabi, (valArray, inputsValues) => {
        createInstance(inputsValues)
      }, txHelper.inputParametersDeclarationToString(ctrabi.inputs), 'Deploy', ctrEVMbc)
      self._view.createPanel.appendChild(createConstructorInstance.render())
      return
    } else {
      self._view.createPanel.innerHTML = 'No compiled contracts'
    }
  }

  selectContractNames.addEventListener('change', setInputParamsPlaceHolder)

  function createInstanceCallback (error, selectedContract, data) {
    if (error) return self._deps.logCallback(`creation of ${selectedContract.name} errored: ` + error)
    self._deps.logCallback(`creation of ${selectedContract.name} pending...`)
    self._deps.udapp.createContract(data, (error, txResult) => {
      if (!error) {
        var isVM = executionContext.isVM()
        if (isVM) {
          var vmError = txExecution.checkVMError(txResult)
          if (vmError.error) {
            self._deps.logCallback(vmError.message)
            return
          }
        }
        if (txResult.result.status && txResult.result.status === '0x0') {
          self._deps.logCallback(`creation of ${selectedContract.name} errored: transaction execution failed`)
          return
        }
        var noInstancesText = self._view.noInstancesText
        if (noInstancesText.parentNode) { noInstancesText.parentNode.removeChild(noInstancesText) }
        var address = isVM ? txResult.result.createdAddress : txResult.result.contractAddress
        instanceContainer.appendChild(self._deps.udappUI.renderInstance(selectedContract.contract.object, address, selectContractNames.value))
      } else {
        self._deps.logCallback(`creation of ${selectedContract.name} errored: ${error}`)
      }
    })
  }

  // DEPLOY INSTANCE
  function createInstance (args) {
    var selectedContract = getSelectedContract()

    if (selectedContract.contract.object.evm.bytecode.object.length === 0) {
      modalDialogCustom.alert('This contract does not implement all functions and thus cannot be created.')
      return
    }

    var forceSend = () => {
      var constructor = txHelper.getConstructorInterface(selectedContract.contract.object.abi)
      self._deps.filePanel.compilerMetadata().metadataOf(selectedContract.name, (error, contractMetadata) => {
        if (error) return self._deps.logCallback(`creation of ${selectedContract.name} errored: ` + error)
        if (!contractMetadata || (contractMetadata && contractMetadata.autoDeployLib)) {
          txFormat.buildData(selectedContract.name, selectedContract.contract.object, self._deps.compiler.getContracts(), true, constructor, args, (error, data) => {
            createInstanceCallback(error, selectedContract, data)
          }, (msg) => {
            self._deps.logCallback(msg)
          }, (data, runTxCallback) => {
            // called for libraries deployment
            self._deps.udapp.runTx(data, runTxCallback)
          })
        } else {
          if (Object.keys(selectedContract.contract.object.evm.bytecode.linkReferences).length) self._deps.logCallback(`linking ${JSON.stringify(selectedContract.contract.object.evm.bytecode.linkReferences, null, '\t')} using ${JSON.stringify(contractMetadata.linkReferences, null, '\t')}`)
          txFormat.encodeConstructorCallAndLinkLibraries(selectedContract.contract.object, args, constructor, contractMetadata.linkReferences, selectedContract.contract.object.evm.bytecode.linkReferences, (error, data) => {
            if (data) data.contractName = selectedContract.name
            createInstanceCallback(error, selectedContract, data)
          })
        }
      })
    }

    if (selectedContract.contract.object.evm.deployedBytecode.object.length / 2 > 24576) {
      modalDialog('Contract code size over limit', yo`<div>Contract creation initialization returns data with length of more than 24576 bytes. The deployment will likely fails. <br>
      More info: <a href="https://github.com/ethereum/EIPs/blob/master/EIPS/eip-170.md" target="_blank">eip-170</a>
      </div>`,
        {
          label: 'Force Send',
          fn: () => {
            forceSend()
          }}, {
            label: 'Cancel',
            fn: () => {
              self._deps.logCallback(`creation of ${selectedContract.name} canceled by user.`)
            }
          })
    } else {
      forceSend()
    }
  }

  // ACCESS DEPLOYED INSTANCE
  function loadFromAddress () {
    var noInstancesText = self._view.noInstancesText
    if (noInstancesText.parentNode) { noInstancesText.parentNode.removeChild(noInstancesText) }
    var contractNames = document.querySelector(`.${css.contractNames.classNames[0]}`)
    var address = atAddressButtonInput.value
    if (!ethJSUtil.isValidAddress(address)) {
      return modalDialogCustom.alert('Invalid address.')
    }
    if (/[a-f]/.test(address) && /[A-F]/.test(address) && !ethJSUtil.isValidChecksumAddress(address)) {
      return modalDialogCustom.alert('Invalid checksum address.')
    }
    if (/.(.abi)$/.exec(self._deps.config.get('currentFile'))) {
      modalDialogCustom.confirm(null, 'Do you really want to interact with ' + address + ' using the current ABI definition ?', () => {
        var abi
        try {
          abi = JSON.parse(self._deps.editor.currentContent())
        } catch (e) {
          return modalDialogCustom.alert('Failed to parse the current file as JSON ABI.')
        }
        instanceContainer.appendChild(self._deps.udappUI.renderInstanceFromABI(abi, address, address))
      })
    } else {
      var contract = self._deps.compiler.getContract(contractNames.children[contractNames.selectedIndex].innerHTML)
      instanceContainer.appendChild(self._deps.udappUI.renderInstance(contract.object, address, selectContractNames.value))
    }
  }

  // GET NAMES OF ALL THE CONTRACTS
  function getContractNames (success, data) {
    var contractNames = document.querySelector(`.${css.contractNames.classNames[0]}`)
    contractNames.innerHTML = ''
    if (success) {
      selectContractNames.removeAttribute('disabled')
      self._deps.compiler.visitContracts((contract) => {
        contractNames.appendChild(yo`<option value="${contract.name}">${contract.name}</option>`)
      })
    } else {
      selectContractNames.setAttribute('disabled', true)
    }
    setInputParamsPlaceHolder()
  }

  return el
}
/* ------------------------------------------------
    section SETTINGS: Environment, Account, Gas, Value
------------------------------------------------ */
function settings (container, self) {
  // VARIABLES
  var net = yo`<span class=${css.network}></span>`
  var networkcallid = 0
  const updateNetwork = (cb) => {
    networkcallid++
    (function (callid) {
      executionContext.detectNetwork((err, { id, name } = {}) => {
        if (networkcallid > callid) return
        networkcallid++
        if (err) {
          console.error(err)
          net.innerHTML = 'can\'t detect network '
        } else {
          net.innerHTML = `<i class="${css.networkItem} fa fa-plug" aria-hidden="true"></i> ${name} (${id || '-'})`
        }
        if (cb) cb(err, {id, name})
      })
    })(networkcallid)
  }
  var environmentEl = yo`
    <div class="${css.crow}">
      <div id="selectExEnv" class="${css.col1_1}">
        Environment
      </div>
      <div class=${css.environment}>
        ${net}
        <select id="selectExEnvOptions" onchange=${() => { updateNetwork() }} class="${css.select}">
          <option id="vm-mode"
            title="Execution environment does not connect to any node, everything is local and in memory only."
            value="vm" checked name="executionContext"> JavaScript VM
          </option>
          <option id="injected-mode"
            title="Execution environment has been provided by Metamask or similar provider."
            value="injected" checked name="executionContext"> Injected Web3
          </option>
          <option id="web3-mode"
            title="Execution environment connects to node at localhost (or via IPC if available), transactions will be sent to the network and can cause loss of money or worse!
            If this page is served via https and you access your node via http, it might not work. In this case, try cloning the repository and serving it via http."
            value="web3" name="executionContext"> Web3 Provider
          </option>
        </select>
        <a href="https://github.com/ethereum/EIPs/blob/master/EIPS/eip-155.md" target="_blank"><i class="${css.icon} fa fa-info"></i></a>
      </div>
    </div>
  `
  var accountEl = yo`
    <div class="${css.crow}">
      <div class="${css.col1_1}">
        Account
        <i class="fa fa-plus-circle ${css.icon}" aria-hidden="true" onclick=${newAccount} title="Create a new account"></i>
      </div>
      <div class=${css.account}>
        <select name="txorigin" class="${css.select}" id="txorigin"></select>
        ${copyToClipboard(() => document.querySelector('#runTabView #txorigin').value)}
        <i class="fa fa-pencil-square-o ${css.icon}" aria-hiden="true" onclick=${signMessage} title="Sign a message using this account key"></i>
      </div>
    </div>
  `
  var gasPriceEl = yo`
    <div class="${css.crow}">
      <div class="${css.col1_1}">Gas limit</div>
      <input type="number" class="${css.col2}" id="gasLimit" value="3000000">
    </div>
  `
  var valueEl = yo`
    <div class="${css.crow}">
      <div class="${css.col1_1}">Value</div>
      <input type="text" class="${css.col2_1}" id="value" value="0" title="Enter the value and choose the unit">
      <select name="unit" class="${css.col2_2}" id="unit">
        <option data-unit="wei">wei</option>
        <option data-unit="gwei">gwei</option>
        <option data-unit="finney">finney</option>
        <option data-unit="ether">ether</option>
      </select>
    </div>
  `
  // DOM ELEMENT
  var el = yo`
    <div class="${css.settings}">
      ${environmentEl}
      ${accountEl}
      ${gasPriceEl}
      ${valueEl}
    </div>
  `
  // HELPER FUNCTIONS AND EVENTS
  self._deps.udapp.event.register('transactionExecuted', (error, from, to, data, lookupOnly, txResult) => {
    if (error) return
    if (!lookupOnly) el.querySelector('#value').value = '0'
    updateAccountBalances(container, self)
  })

  // DROPDOWN
  var selectExEnv = environmentEl.querySelector('#selectExEnvOptions')

  function setFinalContext () {
    // set the final context. Cause it is possible that this is not the one we've originaly selected
    selectExEnv.value = executionContext.getProvider()
    self.event.trigger('clearInstance', [])
    updateNetwork()
    fillAccountsList(el, self)
  }

  self.event.register('clearInstance', () => {
    var instanceContainer = self._view.instanceContainer
    var instanceContainerTitle = self._view.instanceContainerTitle
    instanceContainer.innerHTML = '' // clear the instances list
    instanceContainer.appendChild(instanceContainerTitle)
    instanceContainer.appendChild(self._view.noInstancesText)
  })

  selectExEnv.addEventListener('change', function (event) {
    let context = selectExEnv.options[selectExEnv.selectedIndex].value
    executionContext.executionContextChange(context, null, () => {
      modalDialogCustom.confirm(null, 'Are you sure you want to connect to an ethereum node?', () => {
        modalDialogCustom.prompt(null, 'Web3 Provider Endpoint', 'http://localhost:8545', (target) => {
          executionContext.setProviderFromEndpoint(target, context, (alertMsg) => {
            if (alertMsg) {
              modalDialogCustom.alert(alertMsg)
            }
            setFinalContext()
          })
        }, setFinalContext)
      }, setFinalContext)
    }, (alertMsg) => {
      modalDialogCustom.alert(alertMsg)
    }, setFinalContext)
  })

  selectExEnv.value = executionContext.getProvider()
  executionContext.event.register('contextChanged', (context, silent) => {
    setFinalContext()
  })

  setInterval(() => {
    updateNetwork()
    fillAccountsList(el, self)
  }, 5000)

  setInterval(() => {
    updateAccountBalances(container, self)
  }, 10000)

  function newAccount () {
    self._deps.udapp.newAccount('', (error, address) => {
      if (!error) {
        container.querySelector('#txorigin').appendChild(yo`<option value=${address}>${address}</option>`)
        addTooltip(`account ${address} created`)
      } else {
        addTooltip('Cannot create an account: ' + error)
      }
    })
  }
  function signMessage (event) {
    self._deps.udapp.getAccounts((err, accounts) => {
      if (err) { addTooltip(`Cannot get account list: ${err}`) }
      var signMessageDialog = { 'title': 'Sign a message', 'text': 'Enter a message to sign', 'inputvalue': 'Message to sign' }
      var $txOrigin = container.querySelector('#txorigin')
      var account = $txOrigin.selectedOptions[0].value
      var isVM = executionContext.isVM()
      var isInjected = executionContext.getProvider() === 'injected'
      function alertSignedData (error, hash, signedData) {
        if (error && error.message !== '') {
          console.log(error)
          addTooltip(error.message)
        } else {
          modalDialogCustom.alert(yo`<div><b>hash:</b>${hash}<br><b>signature:</b>${signedData}</div>`)
        }
      }
      if (isVM) {
        modalDialogCustom.promptMulti(signMessageDialog, (message) => {
          const personalMsg = ethJSUtil.hashPersonalMessage(Buffer.from(message))
          var privKey = self._deps.udapp.accounts[account].privateKey
          try {
            var rsv = ethJSUtil.ecsign(personalMsg, privKey)
            var signedData = ethJSUtil.toRpcSig(rsv.v, rsv.r, rsv.s)
            alertSignedData(null, '0x' + personalMsg.toString('hex'), signedData)
          } catch (e) {
            addTooltip(e.message)
            return
          }
        }, false)
      } else if (isInjected) {
        modalDialogCustom.promptMulti(signMessageDialog, (message) => {
          const hashedMsg = executionContext.web3().sha3(message)
          try {
            executionContext.web3().eth.sign(account, hashedMsg, (error, signedData) => {
              alertSignedData(error, hashedMsg, signedData)
            })
          } catch (e) {
            addTooltip(e.message)
            console.log(e)
            return
          }
        })
      } else {
        modalDialogCustom.promptPassphrase('Passphrase to sign a message', 'Enter your passphrase for this account to sign the message', '', (passphrase) => {
          modalDialogCustom.promptMulti(signMessageDialog, (message) => {
            const hashedMsg = executionContext.web3().sha3(message)
            try {
              var personal = new Personal(executionContext.web3().currentProvider)
              personal.sign(hashedMsg, account, passphrase, (error, signedData) => {
                alertSignedData(error, hashedMsg, signedData)
              })
            } catch (e) {
              addTooltip(e.message)
              console.log(e)
              return
            }
          })
        }, false)
      }
    })
  }

  return el
}

module.exports = runTab
