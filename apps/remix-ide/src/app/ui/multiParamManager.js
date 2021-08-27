'use strict'

var yo = require('yo-yo')
var css = require('../../universal-dapp-styles')
var copyToClipboard = require('./copy-to-clipboard')
var remixLib = require('@remix-project/remix-lib')
var txFormat = remixLib.execution.txFormat

function stringToBytes32(str) {
  const bytes = new TextEncoder().encode(str)
  if(bytes.length > 32) {
    // TODO find a better way to report the error
    alert(`String too long '${str}'`)
    return "'${str}'"
  }

  const hex = [...bytes, ...Array(32).fill(0)]
    .slice(0, 32)
    .map((c) => `00${c.toString(16)}`.slice(-2))
    .join('')
  return `"0x${hex}"`
}

function preprocessVal(str) {
  return str.replace(/'([^']+)?'/g, (s, a) => stringToBytes32(a)) // replace strings denoted as bytes32 in the contract
}

class MultiParamManager {
  /**
    *
    * @param {bool} lookupOnly
    * @param {Object} funABI
    * @param {Function} clickMultiCallBack
    * @param {string} inputs
    * @param {string} title
    * @param {string} evmBC
    *
    */
  constructor (lookupOnly, funABI, clickCallBack, inputs, title, evmBC, isDeploy) {
    this.lookupOnly = lookupOnly
    this.funABI = funABI
    this.clickCallBack = clickCallBack
    this.inputs = inputs
    this.title = title
    this.evmBC = evmBC
    this.basicInputField = null
    this.multiFields = null
    this.isDeploy = isDeploy
  }

  switchMethodViewOn () {
    this.contractActionsContainerSingle.style.display = 'none'
    this.contractActionsContainerMulti.style.display = 'flex'
    this.makeMultiVal()
  }

  switchMethodViewOff () {
    this.contractActionsContainerSingle.style.display = 'flex'
    this.contractActionsContainerMulti.style.display = 'none'
    var multiValString = this.getMultiValsString()
    if (multiValString) this.basicInputField.value = multiValString
  }

  getValue (item, index) {
    var valStr = item.value.join('')
    return valStr
  }

  getMultiValsString () {
    var valArray = this.multiFields.querySelectorAll('input')
    var ret = ''
    var valArrayTest = []

    for (var j = 0; j < valArray.length; j++) {
      if (ret !== '') ret += ','
      var elVal = valArray[j].value
      valArrayTest.push(elVal)
      elVal = preprocessVal(elVal)
      try {
        JSON.parse(elVal)
      } catch (e) {
        elVal = '"' + elVal + '"'
      }
      ret += elVal
    }
    var valStringTest = valArrayTest.join('')
    if (valStringTest) {
      return ret
    } else {
      return ''
    }
  }

  emptyInputs () {
    var valArray = this.multiFields.querySelectorAll('input')
    for (var k = 0; k < valArray.length; k++) {
      valArray[k].value = ''
    }
    this.basicInputField.value = ''
  }

  makeMultiVal () {
    var inputString = this.basicInputField.value
    if (inputString) {
      inputString = preprocessVal(inputString)
      var inputJSON = JSON.parse('[' + inputString + ']')
      var multiInputs = this.multiFields.querySelectorAll('input')
      for (var k = 0; k < multiInputs.length; k++) {
        if (inputJSON[k]) {
          multiInputs[k].value = JSON.stringify(inputJSON[k])
        }
      }
    }
  }

  createMultiFields () {
    if (this.funABI.inputs) {
      return yo`<div>
        ${this.funABI.inputs.map(function (inp) {
          return yo`<div class="${css.multiArg}"><label for="${inp.name}"> ${inp.name}: </label><input class="form-control" placeholder="${inp.type}" title="${inp.name}" data-id="multiParamManagerInput${inp.name}"></div>`
        })}
      </div>`
    }
  }

  render () {
    var title
    if (this.title) {
      title = this.title
    } else if (this.funABI.name) {
      title = this.funABI.name
    } else {
      title = this.funABI.type === 'receive' ? '(receive)' : '(fallback)'
    }

    this.basicInputField = yo`<input class="form-control" data-id="multiParamManagerBasicInputField"></input>`
    this.basicInputField.setAttribute('placeholder', this.inputs)
    this.basicInputField.setAttribute('title', this.inputs)
    this.basicInputField.setAttribute('data-id', this.inputs)

    var onClick = () => {
      this.clickCallBack(this.funABI.inputs, preprocessVal(this.basicInputField.value))
    }
    const width = this.isDeploy ? '' : 'w-50'
    const funcButton = yo`<button onclick=${() => onClick()} class="${css.instanceButton} ${width} btn btn-sm" data-id="multiParamManagerFuncButton">${title}</button>`
    this.contractActionsContainerSingle = yo`
    <div class="${css.contractActionsContainerSingle} pt-2">
      ${funcButton}
      ${this.basicInputField}
      <i class="fas fa-angle-down ${css.methCaret}" onclick=${() => this.switchMethodViewOn()} title=${title} ></i>
    </div>`

    this.multiFields = this.createMultiFields()

    var multiOnClick = () => {
      var valsString = this.getMultiValsString()
      if (valsString) {
        this.clickCallBack(this.funABI.inputs, valsString)
      } else {
        this.clickCallBack(this.funABI.inputs, '')
      }
    }

    var expandedButton = yo`<button onclick=${() => { multiOnClick() }} class="${css.instanceButton}" data-id="multiParamManagerExpandedButton"></button>`

    this.contractActionsContainerMulti = yo`<div class="${css.contractActionsContainerMulti}" >
      <div class="${css.contractActionsContainerMultiInner} text-dark" >
        <div onclick=${() => { this.switchMethodViewOff() }} class="${css.multiHeader}">
          <div class="${css.multiTitle} run-instance-multi-title">${title}</div>
          <i class='fas fa-angle-up ${css.methCaret}'></i>
        </div>
        ${this.multiFields}
        <div class="${css.group} ${css.multiArg}" >
          ${copyToClipboard(
            () => {
              var multiString = this.getMultiValsString()
              var multiJSON = JSON.parse('[' + multiString + ']')
              var encodeObj
              if (this.evmBC) {
                encodeObj = txFormat.encodeData(this.funABI, multiJSON, this.evmBC)
              } else {
                encodeObj = txFormat.encodeData(this.funABI, multiJSON)
              }
              if (encodeObj.error) {
                throw new Error(encodeObj.error)
              } else {
                return encodeObj.data
              }
            }, 'Encode values of input fields & copy to clipboard', 'fa-clipboard')}
            ${expandedButton}
        </div>
      </div>
    </div>`

    var contractProperty = yo`
      <div class="${css.contractProperty}">
        ${this.contractActionsContainerSingle} ${this.contractActionsContainerMulti}
      </div>
    `
    if (this.lookupOnly) {
      // call. stateMutability is either pure or view
      expandedButton.setAttribute('title', (title + ' - call'))
      expandedButton.innerHTML = 'call'
      expandedButton.classList.add('btn-info')
      expandedButton.setAttribute('data-id', (title + ' - call'))
      funcButton.setAttribute('title', (title + ' - call'))
      funcButton.classList.add('btn-info')
      funcButton.setAttribute('data-id', (title + ' - call'))
    } else if (this.funABI.stateMutability === 'payable' || this.funABI.payable) {
      // transact. stateMutability = payable
      expandedButton.setAttribute('title', (title + ' - transact (payable)'))
      expandedButton.innerHTML = 'transact'
      expandedButton.classList.add('btn-danger')
      expandedButton.setAttribute('data-id', (title + ' - transact (payable)'))
      funcButton.setAttribute('title', (title + ' - transact (payable)'))
      funcButton.classList.add('btn-danger')
      funcButton.setAttribute('data-id', (title + ' - transact (payable)'))
    } else {
      // transact. stateMutability = nonpayable
      expandedButton.setAttribute('title', (title + ' - transact (not payable)'))
      expandedButton.innerHTML = 'transact'
      expandedButton.classList.add('btn-warning')
      expandedButton.setAttribute('data-id', (title + ' - transact (not payable)'))
      funcButton.classList.add('btn-warning')
      funcButton.setAttribute('title', (title + ' - transact (not payable)'))
      funcButton.setAttribute('data-id', (title + ' - transact (not payable)'))
    }

    if (this.funABI.inputs && this.funABI.inputs.length > 0) {
      contractProperty.classList.add(css.hasArgs)
    } else if (this.funABI.type === 'fallback' || this.funABI.type === 'receive') {
      contractProperty.classList.add(css.hasArgs)
      this.basicInputField.setAttribute('title', `'(${this.funABI.type}')`) // probably should pass name instead
      this.contractActionsContainerSingle.querySelector('i').style.visibility = 'hidden'
      this.basicInputField.setAttribute('data-id', `'(${this.funABI.type}')`)
    } else {
      this.contractActionsContainerSingle.querySelector('i').style.visibility = 'hidden'
      this.basicInputField.style.visibility = 'hidden'
    }

    return contractProperty
  }
}

module.exports = MultiParamManager
