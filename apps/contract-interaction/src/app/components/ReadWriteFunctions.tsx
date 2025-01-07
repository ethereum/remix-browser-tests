import { useEffect, useState } from 'react'
import { useIntl } from 'react-intl'
import { FuncABI } from '@remix-project/core-plugin'
import { CopyToClipboard } from '@remix-ui/clipboard'
import * as remixLib from '@remix-project/remix-lib'
import * as ethJSUtil from '@ethereumjs/util'
import { ContractGUI } from './ContractGUI'
import { TreeView, TreeViewItem } from '@remix-ui/tree-view'
import { BN } from 'bn.js'
import { is0XPrefixed, isHexadecimal } from '@remix-ui/helper'
import { ABICategory, ContractInstance } from '../types'

// TODO: pooling to update contract balance.

const txHelper = remixLib.execution.txHelper

export interface ReadWriteFunctionsProps {
  // TODO:
  // runTabState: RunTabState
  // runTransactions: (
  //   instanceIndex: number,
  //   lookupOnly: boolean,
  //   funcABI: FuncABI,
  //   inputsValues: string,
  //   contractName: string,
  //   contractABI, contract,
  //   address,
  //   logMsg:string,
  //   // mainnetPrompt: MainnetPrompt,
  //   gasEstimationPrompt: (msg: string) => JSX.Element,
  //   passphrasePrompt: (msg: string) => JSX.Element,
  //   funcIndex?: number) => void,
  // sendValue: string,
  // passphrasePrompt: (message: string) => JSX.Element,
  //  gasEstimationPrompt: (msg: string) => JSX.Element,s
  // mainnetPrompt: (tx: Tx, network: Network, amount: string, gasEstimation: string, gasFees: (maxFee: string, cb: (txFeeText: string, priceStatus: boolean) => void) => void, determineGasPrice: (cb: (txFeeText: string, gasPriceValue: string, gasPriceStatus: boolean) => void) => void) => JSX.Element,
  // getCompilerDetails: () => Promise<CheckStatus>
  evmCheckComplete?: boolean,
  instance: ContractInstance,
  index: number,
  getFuncABIInputs: (funcABI: FuncABI) => string,
  exEnvironment: string,
  editInstance: (instance) => void,
  solcVersion: { version: string, canReceive: boolean }
  contractABI: { category: ABICategory, abi: FuncABI[] }
}

export function ReadWriteFunctions(props: ReadWriteFunctionsProps) {
  const intl = useIntl()
  const [toggleExpander, setToggleExpander] = useState<boolean>(true)
  // const [contractABI, setContractABI] = useState<FuncABI[]>(null)
  const [address, setAddress] = useState<string>('')
  const [expandPath, setExpandPath] = useState<string[]>([])
  const [llIError, setLlIError] = useState<string>('')
  const [calldataValue, setCalldataValue] = useState<string>('')
  const [evmBC, setEvmBC] = useState(null)

  useEffect(() => {
    // if (!props.instance.abi) {
    //    const abi = txHelper.sortAbiFunction(props.instance.contractData.abi)
    //   setContractABI(props.instance.abi)
    // } else {
    //   setContractABI(props.instance.abi)
    // }

    if (props.instance.address) {
      let address =
        (props.instance.address.slice(0, 2) === '0x' ? '' : '0x') +
        // @ts-ignore
        props.instance.address.toString('hex')

      address = ethJSUtil.toChecksumAddress(address)
      setAddress(address)
    }
  }, [props.instance.address])


  // useEffect(() => {
  //   if (props.instance.contractData) {
  //     setEvmBC(props.instance.contractData.bytecodeObject)
  //   }
  // }, [props.instance.contractData])

  const sendData = () => {
    setLlIError('')
    const fallback = txHelper.getFallbackInterface(props.contractABI)
    const receive = txHelper.getReceiveInterface(props.contractABI)
    const args = {
      funcABI: fallback || receive,
      address: address,
      contractName: props.instance.name,
      contractABI: props.contractABI
    }
    // const amount = props.sendValue

    // if (amount !== '0') {
    //   // check for numeric and receive/fallback
    //   if (!isNumeric(amount)) {
    //     return setLlIError(intl.formatMessage({ id: 'udapp.llIError1' }))
    //   } else if (!receive && !(fallback && fallback.stateMutability === 'payable')) {
    //     return setLlIError(intl.formatMessage({ id: 'udapp.llIError2' }))
    //   }
    // }
    let calldata = calldataValue

    if (calldata) {
      if (calldata.length < 4 && is0XPrefixed(calldata)) {
        return setLlIError(intl.formatMessage({ id: 'udapp.llIError3' }))
      } else {
        if (is0XPrefixed(calldata)) {
          calldata = calldata.substr(2, calldata.length)
        }
        if (!isHexadecimal(calldata)) {
          return setLlIError(intl.formatMessage({ id: 'udapp.llIError4' }))
        }
      }
      if (!fallback) {
        return setLlIError(intl.formatMessage({ id: 'udapp.llIError5' }))
      }
    }

    if (!receive && !fallback) return setLlIError(intl.formatMessage({ id: 'udapp.llIError6' }))

    // we have to put the right function ABI:
    // if receive is defined and that there is no calldata => receive function is called
    // if fallback is defined => fallback function is called
    if (receive && !calldata) args.funcABI = receive
    else if (fallback) args.funcABI = fallback

    if (!args.funcABI) return setLlIError(intl.formatMessage({ id: 'udapp.llIError7' }))
    runTransaction(false, args.funcABI, null, calldataValue)
  }


  const runTransaction = (lookupOnly, funcABI: FuncABI, valArr, inputsValues, funcIndex?: number) => {
    // if (props.instance.isPinned) _paq.push(['trackEvent', 'udapp', 'pinContracts', 'interactWithPinned'])
    const functionName = funcABI.type === 'function' ? funcABI.name : `(${funcABI.type})`
    const logMsg = `${lookupOnly ? 'call' : 'transact'} to ${props.instance.name}.${functionName}`

    // props.runTransactions(
    //   props.index,
    //   lookupOnly,
    //   funcABI,
    //   inputsValues,
    //   props.instance.name,
    //   contractABI,
    //   props.instance.contractData,
    //   address,
    //   logMsg,
    //   props.mainnetPrompt,
    //   props.gasEstimationPrompt,
    //   props.passphrasePrompt,
    //   funcIndex
    // )
  }

  const extractDataDefault = (item, parent?) => {
    const ret: any = {}

    if (BN.isBN(item)) {
      ret.self = item.toString(10)
      ret.children = []
    } else {
      if (item instanceof Array) {
        ret.children = item.map((item, index) => {
          return { key: index, value: item }
        })
        ret.self = 'Array'
        ret.isNode = true
        ret.isLeaf = false
      } else if (item instanceof Object) {
        ret.children = Object.keys(item).map((key) => {
          return { key: key, value: item[key] }
        })
        ret.self = 'Object'
        ret.isNode = true
        ret.isLeaf = false
      } else {
        ret.self = item
        ret.children = null
        ret.isNode = false
        ret.isLeaf = true
      }
    }
    return ret
  }

  const handleExpand = (path: string) => {
    if (expandPath.includes(path)) {
      const filteredPath = expandPath.filter((value) => value !== path)

      setExpandPath(filteredPath)
    } else {
      setExpandPath([...expandPath, path])
    }
  }

  const handleCalldataChange = (e) => {
    const value = e.target.value

    setCalldataValue(value)
  }

  const label = (key: string | number, value: string) => {
    return (
      <div className="d-flex mt-2 flex-row label_item">
        <label className="small font-weight-bold mb-0 pr-1 label_key">{key}:</label>
        <label className="m-0 label_value">{value}</label>
      </div>
    )
  }

  const renderData = (item, parent, key: string | number, keyPath: string) => {
    const data = extractDataDefault(item, parent)
    const children = (data.children || []).map((child, index) => {
      return renderData(child.value, data, child.key, keyPath + '/' + child.key)
    })

    if (children && children.length > 0) {
      return (
        <TreeViewItem id={`treeViewItem${key}`} key={keyPath} label={label(key, data.self)} onClick={() => handleExpand(keyPath)} expand={expandPath.includes(keyPath)}>
          <TreeView id={`treeView${key}`} key={keyPath}>
            {children}
          </TreeView>
        </TreeViewItem>
      )
    } else {
      return <TreeViewItem id={key.toString()} key={keyPath} label={label(key, data.self)} onClick={() => handleExpand(keyPath)} expand={expandPath.includes(keyPath)} />
    }
  }

  return (
    <>
      <span className="input-group-text udapp_spanTitleText">
        {props.contractABI.category}
      </span>
      {props.contractABI &&
        props.contractABI.abi.map((funcABI, index) => {
          if (funcABI.type !== 'function') return null
          const isConstant = funcABI.constant !== undefined ? funcABI.constant : false
          const lookupOnly = funcABI.stateMutability === 'view' || funcABI.stateMutability === 'pure' || isConstant
          const inputs = props.getFuncABIInputs(funcABI)

          return (
            <div key={index}>
              <ContractGUI
                // TODO
                // getVersion={props.getVersion}
                // getCompilerDetails={props.getCompilerDetails}
                // runTabState={props.runTabState}
                // clickCallBack={(valArray: {name: string; type: string}[], inputsValues: string) => {
                //   runTransaction(lookupOnly, funcABI, valArray, inputsValues, index)
                // }}
                evmCheckComplete={props.evmCheckComplete}
                funcABI={funcABI}
                inputs={inputs}
                evmBC={evmBC}
                lookupOnly={lookupOnly}
                key={index}
              />
              {lookupOnly && (
                <div className="udapp_value" data-id="udapp_value">
                  <TreeView id="treeView">
                    {Object.keys(props.instance.decodedResponse || {}).map((key) => {
                      const funcIndex = index.toString()
                      const response = props.instance.decodedResponse[key]

                      return key === funcIndex
                        ? Object.keys(response || {}).map((innerkey, index) => {
                          return renderData(props.instance.decodedResponse[key][innerkey], response, innerkey, innerkey)
                        })
                        : null
                    })}
                  </TreeView>
                </div>
              )}
            </div>
          )
        })}
    </>
  )
}
