import { BN } from 'ethereumjs-util'
const $ = require('jquery')
const yo = require('yo-yo')
const remixLib = require('@remix-project/remix-lib')
const EventManager = remixLib.EventManager
const css = require('../styles/run-tab-styles')
const copyToClipboard = require('../../ui/copy-to-clipboard')
const modalDialogCustom = require('../../ui/modal-dialog-custom')
const addTooltip = require('../../ui/tooltip')
const helper = require('../../../lib/helper.js')
const globalRegistry = require('../../../global/registry')

class SettingsUI {
  constructor (blockchain, networkModule) {
    this.blockchain = blockchain
    this.event = new EventManager()
    this._components = {}

    this.blockchain.event.register('transactionExecuted', (error, from, to, data, lookupOnly, txResult) => {
      if (!lookupOnly) this.el.querySelector('#value').value = 0
      if (error) return
      this.updateAccountBalances()
    })
    this._components = {
      registry: globalRegistry,
      networkModule: networkModule
    }
    this._components.registry = globalRegistry
    this._deps = {
      config: this._components.registry.get('config').api
    }

    this._deps.config.events.on('settings/personal-mode_changed', this.onPersonalChange.bind(this))

    setInterval(() => {
      this.updateAccountBalances()
    }, 1000)

    this.accountListCallId = 0
    this.loadedAccounts = {}
  }

  updateAccountBalances () {
    if (!this.el) return
    var accounts = $(this.el.querySelector('#txorigin')).children('option')
    accounts.each((index, account) => {
      this.blockchain.getBalanceInEther(account.value, (err, balance) => {
        if (err) return
        const updated = helper.shortenAddress(account.value, balance)
        if (updated !== account.innerText) { // check if the balance has been updated and update UI accordingly.
          account.innerText = updated
        }
      })
    })
  }

  validateInputKey (e) {
    // preventing not numeric keys
    // preventing 000 case
    if (!helper.isNumeric(e.key) ||
      (e.key === '0' && !parseFloat(this.el.querySelector('#value').value) && this.el.querySelector('#value').value.length > 0)) {
      e.preventDefault()
      e.stopImmediatePropagation()
    }
  }

  validateValue () {
    const valueEl = this.el.querySelector('#value')
    if (!valueEl.value) {
      // assign 0 if given value is
      // - empty
      valueEl.value = 0
      return
    }

    let v
    try {
      v = new BN(valueEl.value, 10)
      valueEl.value = v.toString(10)
    } catch (e) {
      // assign 0 if given value is
      // - not valid (for ex 4345-54)
      // - contains only '0's (for ex 0000) copy past or edit
      valueEl.value = 0
    }

    // if giveen value is negative(possible with copy-pasting) set to 0
    if (v.lt(0)) valueEl.value = 0
  }

  render () {
    this.netUI = yo`<span class="${css.network} badge badge-secondary"></span>`

    var environmentEl = yo`
      <div class="${css.crow}">
        <label id="selectExEnv" class="${css.settingsLabel}">
          Environment
        </label>
        <div class="${css.environment}">
          <select id="selectExEnvOptions" data-id="settingsSelectEnvOptions" class="form-control ${css.select} custom-select">
            <option id="vm-mode-london" data-id="settingsVMLondonMode"
              title="Execution environment does not connect to any node, everything is local and in memory only."
              value="vm-london" name="executionContext" fork="london"> JavaScript VM (London)
            </option>
            <option id="vm-mode-berlin" data-id="settingsVMBerlinMode"
              title="Execution environment does not connect to any node, everything is local and in memory only."
              value="vm-berlin" name="executionContext" fork="berlin" > JavaScript VM (Berlin)
            </option>
            <option id="injected-mode" data-id="settingsInjectedMode"
              title="Execution environment has been provided by Metamask or similar provider."
              value="injected" name="executionContext"> Injected Web3
            </option>
            <option id="web3-mode" data-id="settingsWeb3Mode"
              title="Execution environment connects to node at localhost (or via IPC if available), transactions will be sent to the network and can cause loss of money or worse!
              If this page is served via https and you access your node via http, it might not work. In this case, try cloning the repository and serving it via http."
              value="web3" name="executionContext"> Web3 Provider
            </option>
          </select>
          <a href="https://remix-ide.readthedocs.io/en/latest/run.html#run-setup" target="_blank"><i class="${css.infoDeployAction} ml-2 fas fa-info" title="check out docs to setup Environment"></i></a>
        </div>
      </div>
    `
    const networkEl = yo`
    <div class="${css.crow}">
        <div class="${css.settingsLabel}">
        </div>
        <div class="${css.environment}" data-id="settingsNetworkEnv">
          ${this.netUI}
        </div>
      </div>
    `
    const accountEl = yo`
      <div class="${css.crow}">
        <label class="${css.settingsLabel}">
          Account
          <span id="remixRunPlusWraper" title="Create a new account" onload=${this.updatePlusButton.bind(this)}>
            <i id="remixRunPlus" class="fas fa-plus-circle ${css.icon}" aria-hidden="true" onclick=${this.newAccount.bind(this)}"></i>
          </span>
        </label>
        <div class="${css.account}">
          <select data-id="runTabSelectAccount" name="txorigin" class="form-control ${css.select} custom-select pr-4" id="txorigin"></select>
          <div style="margin-left: -5px;">${copyToClipboard(() => document.querySelector('#runTabView #txorigin').value)}</div>
          <i id="remixRunSignMsg" data-id="settingsRemixRunSignMsg" class="mx-1 fas fa-edit ${css.icon}" aria-hidden="true" onclick=${this.signMessage.bind(this)} title="Sign a message using this account key"></i>
        </div>
      </div>
    `

    const gasPriceEl = yo`
      <div class="${css.crow}">
        <label class="${css.settingsLabel}">Gas limit</label>
        <input type="number" class="form-control ${css.gasNval} ${css.col2}" id="gasLimit" value="3000000">
      </div>
    `

    const valueEl = yo`
      <div class="${css.crow}">
        <label class="${css.settingsLabel}" data-id="remixDRValueLabel">Value</label>
        <div class="${css.gasValueContainer}">
          <input
            type="number"
            min="0"
            pattern="^[0-9]"
            step="1"
            class="form-control ${css.gasNval} ${css.col2}"
            id="value"
            data-id="dandrValue"
            value="0"
            title="Enter the value and choose the unit"
            onkeypress=${(e) => this.validateInputKey(e)}
            onchange=${() => this.validateValue()}
          >
          <select name="unit" class="form-control p-1 ${css.gasNvalUnit} ${css.col2_2} custom-select" id="unit">
            <option data-unit="wei">wei</option>
            <option data-unit="gwei">gwei</option>
            <option data-unit="finney">finney</option>
            <option data-unit="ether">ether</option>
          </select>
        </div>
      </div>
    `

    const el = yo`
      <div class="${css.settings}">
        ${environmentEl}
        ${networkEl}
        ${accountEl}
        ${gasPriceEl}
        ${valueEl}
      </div>
    `

    var selectExEnv = environmentEl.querySelector('#selectExEnvOptions')
    this.setDropdown(selectExEnv)

    this.blockchain.event.register('contextChanged', (context, silent) => {
      this.setFinalContext()
    })

    this.blockchain.event.register('networkStatus', ({ error, network }) => {
      if (error) {
        this.netUI.innerHTML = 'can\'t detect network '
        return
      }
      const networkProvider = this._components.networkModule.getNetworkProvider.bind(this._components.networkModule)
      this.netUI.innerHTML = (networkProvider() !== 'vm') ? `${network.name} (${network.id || '-'}) network` : ''
    })

    setInterval(() => {
      this.fillAccountsList()
    }, 1000)

    this.el = el

    this.fillAccountsList()
    return el
  }

  setDropdown (selectExEnv) {
    this.selectExEnv = selectExEnv

    const addProvider = (network) => {
      selectExEnv.appendChild(yo`<option
        title="provider name: ${network.name}"
        value="${network.name}"
        name="executionContext"
      >
        ${network.name}
      </option>`)
      addTooltip(yo`<span><b>${network.name}</b> provider added</span>`)
    }

    const removeProvider = (name) => {
      var env = selectExEnv.querySelector(`option[value="${name}"]`)
      if (env) {
        selectExEnv.removeChild(env)
        addTooltip(yo`<span><b>${name}</b> provider removed</span>`)
      }
    }
    this.blockchain.event.register('addProvider', provider => addProvider(provider))
    this.blockchain.event.register('removeProvider', name => removeProvider(name))

    selectExEnv.addEventListener('change', (event) => {
      const provider = selectExEnv.options[selectExEnv.selectedIndex]
      const fork = provider.getAttribute('fork') // can be undefined if connected to an external source (web3 provider / injected)
      let context = provider.value
      context = context.startsWith('vm') ? 'vm' : context // context has to be 'vm', 'web3' or 'injected'
      this.setExecutionContext({ context, fork })
    })

    selectExEnv.value = this._getProviderDropdownValue()
  }

  setExecutionContext (context) {
    this.blockchain.changeExecutionContext(context, () => {
      modalDialogCustom.prompt('External node request', this.web3ProviderDialogBody(), 'http://127.0.0.1:8545', (target) => {
        this.blockchain.setProviderFromEndpoint(target, context, (alertMsg) => {
          if (alertMsg) addTooltip(alertMsg)
          this.setFinalContext()
        })
      }, this.setFinalContext.bind(this))
    }, (alertMsg) => {
      addTooltip(alertMsg)
    }, this.setFinalContext.bind(this))
  }

  web3ProviderDialogBody () {
    const thePath = '<path/to/local/folder/for/test/chain>'

    return yo`
      <div class="">
        Note: To use Geth & https://remix.ethereum.org, configure it to allow requests from Remix:(see <a href="https://geth.ethereum.org/docs/rpc/server" target="_blank">Geth Docs on rpc server</a>)
        <div class="border p-1">geth --http --http.corsdomain https://remix.ethereum.org</div>
        <br>
        To run Remix & a local Geth test node, use this command: (see <a href="https://geth.ethereum.org/getting-started/dev-mode" target="_blank">Geth Docs on Dev mode</a>)
        <div class="border p-1">geth --http --http.corsdomain="${window.origin}" --http.api web3,eth,debug,personal,net --vmdebug --datadir ${thePath} --dev console</div>
        <br>
        <br> 
        <b>WARNING:</b> It is not safe to use the --http.corsdomain flag with a wildcard: <b>--http.corsdomain *</b>
        <br>
        <br>For more info: <a href="https://remix-ide.readthedocs.io/en/latest/run.html#more-about-web3-provider" target="_blank">Remix Docs on Web3 Provider</a>
        <br>
        <br> 
        Web3 Provider Endpoint
      </div>
    `
  }

  /**
   * generate a value used by the env dropdown list.
   * @return {String} - can return 'vm-berlin, 'vm-london', 'injected' or 'web3'
   */
  _getProviderDropdownValue () {
    const provider = this.blockchain.getProvider()
    const fork = this.blockchain.getCurrentFork()
    return provider === 'vm' ? provider + '-' + fork : provider
  }

  setFinalContext () {
    // set the final context. Cause it is possible that this is not the one we've originaly selected
    this.selectExEnv.value = this._getProviderDropdownValue()
    this.event.trigger('clearInstance', [])
    this.updatePlusButton()
  }

  updatePlusButton () {
    // enable/disable + button
    const plusBtn = document.getElementById('remixRunPlus')
    const plusTitle = document.getElementById('remixRunPlusWraper')
    switch (this.selectExEnv.value) {
      case 'injected':
        plusBtn.classList.add(css.disableMouseEvents)
        plusTitle.title = "Unfortunately it's not possible to create an account using injected web3. Please create the account directly from your provider (i.e metamask or other of the same type)."

        break
      case 'vm':
        plusBtn.classList.remove(css.disableMouseEvents)
        plusTitle.title = 'Create a new account'

        break

      case 'web3':
        this.onPersonalChange()

        break
      default: {
        plusBtn.classList.add(css.disableMouseEvents)
        plusTitle.title = `Unfortunately it's not possible to create an account using an external wallet (${this.selectExEnv.value}).`
      }
    }
  }

  onPersonalChange () {
    const plusBtn = document.getElementById('remixRunPlus')
    const plusTitle = document.getElementById('remixRunPlusWraper')
    if (!this._deps.config.get('settings/personal-mode')) {
      plusBtn.classList.add(css.disableMouseEvents)
      plusTitle.title = 'Creating an account is possible only in Personal mode. Please go to Settings to enable it.'
    } else {
      plusBtn.classList.remove(css.disableMouseEvents)
      plusTitle.title = 'Create a new account'
    }
  }

  newAccount () {
    this.blockchain.newAccount(
      '',
      (cb) => {
        modalDialogCustom.promptPassphraseCreation((error, passphrase) => {
          if (error) {
            return modalDialogCustom.alert(error)
          }
          cb(passphrase)
        }, () => {})
      },
      (error, address) => {
        if (error) {
          return addTooltip('Cannot create an account: ' + error)
        }
        addTooltip(`account ${address} created`)
      }
    )
  }

  getSelectedAccount () {
    return this.el.querySelector('#txorigin').selectedOptions[0].value
  }

  getEnvironment () {
    return this.blockchain.getProvider()
  }

  signMessage () {
    this.blockchain.getAccounts((err, accounts) => {
      if (err) {
        return addTooltip(`Cannot get account list: ${err}`)
      }

      var signMessageDialog = { title: 'Sign a message', text: 'Enter a message to sign', inputvalue: 'Message to sign' }
      var $txOrigin = this.el.querySelector('#txorigin')
      if (!$txOrigin.selectedOptions[0] && (this.blockchain.isInjectedWeb3() || this.blockchain.isWeb3Provider())) {
        return addTooltip('Account list is empty, please make sure the current provider is properly connected to remix')
      }

      var account = $txOrigin.selectedOptions[0].value

      var promptCb = (passphrase) => {
        const modal = modalDialogCustom.promptMulti(signMessageDialog, (message) => {
          this.blockchain.signMessage(message, account, passphrase, (err, msgHash, signedData) => {
            if (err) {
              return addTooltip(err)
            }
            modal.hide()
            modalDialogCustom.alert(yo`
              <div>
                <b>hash:</b><br>
                <span id="remixRunSignMsgHash" data-id="settingsRemixRunSignMsgHash">${msgHash}</span>
                <br><b>signature:</b><br>
                <span id="remixRunSignMsgSignature" data-id="settingsRemixRunSignMsgSignature">${signedData}</span>
              </div>
            `)
          })
        }, false)
      }

      if (this.blockchain.isWeb3Provider()) {
        return modalDialogCustom.promptPassphrase(
          'Passphrase to sign a message',
          'Enter your passphrase for this account to sign the message',
          '',
          promptCb,
          false
        )
      }
      promptCb()
    })
  }

  // TODO: unclear what's the goal of accountListCallId, feels like it can be simplified
  async fillAccountsList () {
    this.accountListCallId++
    const callid = this.accountListCallId
    const txOrigin = this.el.querySelector('#txorigin')
    let accounts = []
    try {
      accounts = await this.blockchain.getAccounts()
    } catch (e) {
      addTooltip(`Cannot get account list: ${e}`)
    }
    if (!accounts) accounts = []
    if (this.accountListCallId > callid) return
    this.accountListCallId++
    for (const loadedaddress in this.loadedAccounts) {
      if (accounts.indexOf(loadedaddress) === -1) {
        txOrigin.removeChild(txOrigin.querySelector('option[value="' + loadedaddress + '"]'))
        delete this.loadedAccounts[loadedaddress]
      }
    }
    for (const i in accounts) {
      const address = accounts[i]
      if (!this.loadedAccounts[address]) {
        txOrigin.appendChild(yo`<option value="${address}" >${address}</option>`)
        this.loadedAccounts[address] = 1
      }
    }
    txOrigin.setAttribute('value', accounts[0])
  }
}

module.exports = SettingsUI
