'use strict'
import { ethers } from 'ethers'
import { getFunctionFragment } from './txHelper'

/**
  * deploy the given contract
  *
  * @param {String} from    - sender address
  * @param {String} data    - data to send with the transaction ( return of txFormat.buildData(...) ).
  * @param {String} value    - decimal representation of value.
  * @param {String} gasLimit    - decimal representation of gas limit.
  * @param {Object} txRunner    - TxRunner.js instance
  * @param {Object} callbacks    - { confirmationCb, gasEstimationForceSend, promptCb }
  *     [validate transaction] confirmationCb (network, tx, gasEstimation, continueTxExecution, cancelCb)
  *     [transaction failed, force send] gasEstimationForceSend (error, continueTxExecution, cancelCb)
  *     [personal mode enabled, need password to continue] promptCb (okCb, cancelCb)
  * @param {Function} finalCallback    - last callback.
  */
export function createContract (from, data, value, gasLimit, txRunner, callbacks, finalCallback) {
  if (!callbacks.confirmationCb || !callbacks.gasEstimationForceSend || !callbacks.promptCb) {
    return finalCallback('all the callbacks must have been defined')
  }
  const tx = { from: from, to: null, data: data, useCall: false, value: value, gasLimit: gasLimit }
  txRunner.rawRun(tx, callbacks.confirmationCb, callbacks.gasEstimationForceSend, callbacks.promptCb, (error, txResult) => {
    // see universaldapp.js line 660 => 700 to check possible values of txResult (error case)
    finalCallback(error, txResult)
  })
}

/**
  * call the current given contract ! that will create a transaction !
  *
  * @param {String} from    - sender address
  * @param {String} to    - recipient address
  * @param {String} data    - data to send with the transaction ( return of txFormat.buildData(...) ).
  * @param {String} value    - decimal representation of value.
  * @param {String} gasLimit    - decimal representation of gas limit.
  * @param {Object} txRunner    - TxRunner.js instance
  * @param {Object} callbacks    - { confirmationCb, gasEstimationForceSend, promptCb }
  *     [validate transaction] confirmationCb (network, tx, gasEstimation, continueTxExecution, cancelCb)
  *     [transaction failed, force send] gasEstimationForceSend (error, continueTxExecution, cancelCb)
  *     [personal mode enabled, need password to continue] promptCb (okCb, cancelCb)
  * @param {Function} finalCallback    - last callback.
  */
export function callFunction (from, to, data, value, gasLimit, funAbi, txRunner, callbacks, finalCallback) {
  const useCall = funAbi.stateMutability === 'view' || funAbi.stateMutability === 'pure' || funAbi.constant
  const tx = { from, to, data, useCall, value, gasLimit }
  txRunner.rawRun(tx, callbacks.confirmationCb, callbacks.gasEstimationForceSend, callbacks.promptCb, (error, txResult) => {
    // see universaldapp.js line 660 => 700 to check possible values of txResult (error case)
    finalCallback(error, txResult)
  })
}

/**
  * check if the vm has errored
  *
  * @param {Object} execResult    - execution result given by the VM
  * @return {Object} -  { error: true/false, message: DOMNode }
  */
export function checkVMError (execResult, compiledContracts) {
  const errorCode = {
    OUT_OF_GAS: 'out of gas',
    STACK_UNDERFLOW: 'stack underflow',
    STACK_OVERFLOW: 'stack overflow',
    INVALID_JUMP: 'invalid JUMP',
    INVALID_OPCODE: 'invalid opcode',
    REVERT: 'revert',
    STATIC_STATE_CHANGE: 'static state change',
    INTERNAL_ERROR: 'internal error',
    CREATE_COLLISION: 'create collision',
    STOP: 'stop',
    REFUND_EXHAUSTED: 'refund exhausted'
  }
  const ret = {
    error: false,
    message: ''
  }
  if (!execResult.exceptionError) {
    return ret
  }
  const exceptionError = execResult.exceptionError.error || ''
  const error = `VM error: ${exceptionError}.\n`
  let msg
  if (exceptionError === errorCode.INVALID_OPCODE) {
    msg = '\t\n\tThe execution might have thrown.\n'
    ret.error = true
  } else if (exceptionError === errorCode.OUT_OF_GAS) {
    msg = '\tThe transaction ran out of gas. Please increase the Gas Limit.\n'
    ret.error = true
  } else if (exceptionError === errorCode.REVERT) {
    const returnData = execResult.returnValue
    const returnDataHex = returnData.slice(0, 4).toString('hex')
    let customError
    if (compiledContracts) {
      let decodedCustomErrorInputsClean
      for (const file of Object.keys(compiledContracts)) {
        for (const contractName of Object.keys(compiledContracts[file])) {
          const contract = compiledContracts[file][contractName]
          for (const item of contract.abi) {
            if (item.type === 'error') {
              // ethers doesn't crash anymore if "error" type is specified, but it doesn't extract the errors. see:
              // https://github.com/ethers-io/ethers.js/commit/bd05aed070ac9e1421a3e2bff2ceea150bedf9b7
              // we need here to fake the type, so the "getSighash" function works properly
              const fn = getFunctionFragment({ ...item, type: 'function', stateMutability: 'nonpayable' })
              if (!fn) continue
              const sign = fn.getSighash(item.name)
              if (!sign) continue
              if (returnDataHex === sign.replace('0x', '')) {
                customError = item.name
                const functionDesc = fn.getFunction(item.name)
                // decoding error parameters
                const decodedCustomErrorInputs = fn.decodeFunctionData(functionDesc, returnData)
                decodedCustomErrorInputsClean = {}
                let devdoc = {}
                // "contract" reprensents the compilation result containing the NATSPEC documentation
                if (contract && fn.functions && Object.keys(fn.functions).length) {
                  const functionSignature = Object.keys(fn.functions)[0]
                  // we check in the 'devdoc' if there's a developer documentation for this error
                  try {
                    devdoc = (contract.devdoc.errors && contract.devdoc.errors[functionSignature][0]) || {}
                  } catch (e) {
                    console.error(e.message)
                  }
                  // we check in the 'userdoc' if there's an user documentation for this error
                  try {
                    const userdoc = (contract.userdoc.errors && contract.userdoc.errors[functionSignature][0]) || {}
                    if (userdoc && (userdoc as any).notice) customError += ' : ' + (userdoc as any).notice // we append the user doc if any
                  } catch (e) {
                    console.error(e.message)
                  }
                }
                let inputIndex = 0
                for (const input of functionDesc.inputs) {
                  const inputKey = input.name || inputIndex
                  const v = decodedCustomErrorInputs[inputKey]

                  decodedCustomErrorInputsClean[inputKey] = {
                    value: v.toString ? v.toString() : v
                  }
                  if (devdoc && (devdoc as any).params) {
                    decodedCustomErrorInputsClean[input.name].documentation = (devdoc as any).params[inputKey] // we add the developer documentation for this input parameter if any
                  }
                  inputIndex++
                }
                break
              }
            }
          }
        }
      }
      if (decodedCustomErrorInputsClean) {
        msg = '\tThe transaction has been reverted to the initial state.\nError provided by the contract:'
        msg += `\n${customError}`
        msg += '\nParameters:'
        msg += `\n${JSON.stringify(decodedCustomErrorInputsClean, null, ' ')}`
      }
    }
    if (!customError) {
      // It is the hash of Error(string)
      if (returnData && (returnDataHex === '08c379a0')) {
        const abiCoder = new ethers.utils.AbiCoder()
        const reason = abiCoder.decode(['string'], returnData.slice(4))[0]
        msg = `\tThe transaction has been reverted to the initial state.\nReason provided by the contract: "${reason}".`
      } else {
        msg = '\tThe transaction has been reverted to the initial state.\nNote: The called function should be payable if you send value and the value you send should be less than your current balance.'
      }
    }
    ret.error = true
  } else if (exceptionError === errorCode.STATIC_STATE_CHANGE) {
    msg = '\tState changes is not allowed in Static Call context\n'
    ret.error = true
  }
  ret.message = `${error}\n${exceptionError}\n${msg}\nDebug the transaction to get more information.`
  return ret
}
