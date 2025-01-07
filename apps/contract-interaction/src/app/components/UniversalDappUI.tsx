import { useContext, useEffect, useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import { FuncABI } from '@remix-project/core-plugin'
import { CopyToClipboard } from '@remix-ui/clipboard'
import * as ethJSUtil from '@ethereumjs/util'
import { TreeView, TreeViewItem } from '@remix-ui/tree-view'
import { BN } from 'bn.js'
import { CustomTooltip, is0XPrefixed, isHexadecimal, shortenAddress } from '@remix-ui/helper'
import { ReadWriteFunctions } from './ReadWriteFunctions'
import { ABICategory, Chain, ContractInstance } from '../types'
import { AppContext } from '../AppContext'
import { pinInstanceAction, unpinInstanceAction, removeInstanceAction } from '../actions'
const _paq = (window._paq = window._paq || [])

const CONTEXT = 'blockchain';

export interface UdappProps {
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
  // gasEstimationPrompt: (msg: string) => JSX.Element,
  // mainnetPrompt: (tx: Tx, network: Network, amount: string, gasEstimation: string, gasFees: (maxFee: string, cb: (txFeeText: string, priceStatus: boolean) => void) => void, determineGasPrice: (cb: (txFeeText: string, gasPriceValue: string, gasPriceStatus: boolean) => void) => void) => JSX.Element,

  evmCheckComplete?: boolean,
  instance: ContractInstance,
  index: number,
  chain: Chain,
  getFuncABIInputs: (funcABI: FuncABI) => string,
  exEnvironment: string,
  editInstance: (instance) => void,
  solcVersion: { version: string, canReceive: boolean }
}

export function UniversalDappUI(props: UdappProps) {
  const { plugin } = useContext(AppContext);

  const intl = useIntl()
  const [toggleExpander, setToggleExpander] = useState<boolean>(true)
  const [address, setAddress] = useState<string>('')
  const [expandPath, setExpandPath] = useState<string[]>([])
  const [llIError, setLlIError] = useState<string>('')
  const [calldataValue, setCalldataValue] = useState<string>('')
  const [evmBC, setEvmBC] = useState(null)
  const [instanceBalance, setInstanceBalance] = useState(0n)

  useEffect(() => {
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

  useEffect(() => {
    if (props.instance.balance) {
      setInstanceBalance(props.instance.balance)
    }
  }, [props.instance.balance])

  const sendRawData = () => {
    setLlIError('')
    // const fallback = txHelper.getFallbackInterface(props.contractABI)
    // const receive = txHelper.getReceiveInterface(props.contractABI)
    // const args = {
    //   funcABI: fallback || receive,
    //   address: address,
    //   contractName: props.instance.name,
    //   contractABI: props.contractABI
    // }
    // const amount = props.sendValue

    // if (amount !== '0') {
    //   // check for numeric and receive/fallback
    //   if (!isNumeric(amount)) {
    //     return setLlIError(intl.formatMessage({ id: 'udapp.llIError1' }))
    //   } else if (!receive && !(fallback && fallback.stateMutability === 'payable')) {
    //     return setLlIError(intl.formatMessage({ id: 'udapp.llIError2' }))
    //   }
    // }
    // let calldata = calldataValue

    // if (calldata) {
    //   if (calldata.length < 4 && is0XPrefixed(calldata)) {
    //     return setLlIError(intl.formatMessage({ id: 'udapp.llIError3' }))
    //   } else {
    //     if (is0XPrefixed(calldata)) {
    //       calldata = calldata.substr(2, calldata.length)
    //     }
    //     if (!isHexadecimal(calldata)) {
    //       return setLlIError(intl.formatMessage({ id: 'udapp.llIError4' }))
    //     }
    //   }
    //   if (!fallback) {
    //     return setLlIError(intl.formatMessage({ id: 'udapp.llIError5' }))
    //   }
    // }

    // if (!receive && !fallback) return setLlIError(intl.formatMessage({ id: 'udapp.llIError6' }))

    // // we have to put the right function ABI:
    // // if receive is defined and that there is no calldata => receive function is called
    // // if fallback is defined => fallback function is called
    // if (receive && !calldata) args.funcABI = receive
    // else if (fallback) args.funcABI = fallback

    // if (!args.funcABI) return setLlIError(intl.formatMessage({ id: 'udapp.llIError7' }))
    // runTransaction(false, args.funcABI, null, calldataValue)
  }

  const toggleClass = () => {
    setToggleExpander(!toggleExpander)
  }

  const removeContract = async () => {
    if (props.instance.isPinned) {
      await plugin.call('fileManager', 'remove', `.looked-up-contracts/pinned-contracts/${props.chain.chainId}/${props.instance.address}/${props.instance.pinnedTimestamp}.json`)

      _paq.push(['trackEvent', 'contractInteraction', 'pinnedContracts', 'removePin'])
    }
    await removeInstanceAction(props.index)
  }

  const unpinContract = async () => {
    await plugin.call('fileManager', 'remove', `.looked-up-contracts/pinned-contracts/${props.chain.chainId}/${props.instance.address}/${props.instance.pinnedTimestamp}.json`)
    _paq.push(['trackEvent', 'contractInteraction', 'pinnedContracts', 'unPin'])
    unpinInstanceAction(props.index)
  }

  const pinContract = async () => {
    const pinnedTimestamp = Date.now()
    const objToSave: ContractInstance = {
      name: props.instance.name,
      address: props.instance.address,
      // TODO:  "abi: props.instance.abi || props.instance.contractData.abi"
      abi: props.instance.abi,
      pinnedTimestamp,
    }
    await plugin.call('fileManager', 'writeFile', `.looked-up-contracts/pinned-contracts/${props.chain.chainId}/${props.instance.address}/${pinnedTimestamp}.json`, JSON.stringify(objToSave, null, 2))
    _paq.push(['trackEvent', 'contractInteraction', 'pinnedContracts', `pinned at ${props.chain.chainId}`])
    pinInstanceAction(props.index, pinnedTimestamp)
  }

  const runTransaction = (lookupOnly, funcABI: FuncABI, valArr, inputsValues, funcIndex?: number) => {
    // if (props.instance.isPinned) _paq.push(['trackEvent', 'udapp', 'pinContracts', 'interactWithPinned'])
    const functionName = funcABI.type === 'function' ? funcABI.name : `(${funcABI.type})`
    const logMsg = `${lookupOnly ? 'call' : 'transact'} to ${props.instance.name}.${functionName}`

    console.log('not implemented yet')
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
    <div
      className={`instance udapp_instance udapp_run-instance border-dark ${toggleExpander ? 'udapp_hidesub' : 'bg-light'}`}
      id={`instance${address}`}
      data-shared="universalDappUiInstance"
      data-id={props.instance.isPinned ? `pinnedInstance${address}` : `unpinnedInstance${address}`}
    >
      <div className="udapp_title pb-0 alert alert-secondary">
        <span data-id={`universalDappUiTitleExpander${props.index}`} className="btn udapp_titleExpander" onClick={toggleClass} style={{ padding: "0.45rem" }}>
          <i className={`fas ${toggleExpander ? 'fa-angle-right' : 'fa-angle-down'}`} aria-hidden="true"></i>
        </span>
        <div className="input-group udapp_nameNbuts">
          <div className="udapp_titleText input-group-prepend">
            {props.instance.isPinned ? (<CustomTooltip placement="top" tooltipClasses="text-nowrap" tooltipId="udapp_udappUnpinTooltip" tooltipText={props.instance.isPinned ? `Pinned for network: ${props.chain.chainId}, timestamp:  ${new Date(props.instance.pinnedTimestamp).toLocaleString()}` : ''}>
              <span className="input-group-text udapp_spanTitleText">
                {props.instance.name} at {shortenAddress(address)}
              </span>
            </CustomTooltip>) : (<span className="input-group-text udapp_spanTitleText">
              {props.instance.name} at {shortenAddress(address)} ({CONTEXT})
            </span>)}
          </div>
          <div className="btn" style={{ padding: '0.15rem' }}>
            <CopyToClipboard tip={intl.formatMessage({ id: 'udapp.copyAddress' })} content={address} direction={'top'} />
          </div>
          {props.instance.isPinned ? (<div className="btn" style={{ padding: '0.15rem', marginLeft: '-0.5rem' }}>
            <CustomTooltip placement="top" tooltipClasses="text-nowrap" tooltipId="udapp_udappUnpinTooltip" tooltipText={<FormattedMessage id="contractInteraction.unpinContract" />}>
              <i className="fas fa-thumbtack p-2" aria-hidden="true" data-id="universalDappUiUdappUnpin" onClick={unpinContract}></i>
            </CustomTooltip>
          </div>) : (<div className="btn" style={{ padding: '0.15rem', marginLeft: '-0.5rem' }}>
            <CustomTooltip placement="top" tooltipClasses="text-nowrap" tooltipId="udapp_udappPinTooltip" tooltipText={<FormattedMessage id="contractInteraction.pinContract" />}>
              <i className="far fa-thumbtack p-2" aria-hidden="true" data-id="universalDappUiUdappPin" onClick={pinContract}></i>
            </CustomTooltip>
          </div>)
          }
        </div>
        <div className="btn" style={{ padding: '0.15rem', marginLeft: '-0.5rem' }}>
          <CustomTooltip placement="top" tooltipClasses="text-nowrap" tooltipId="udapp_udappCloseTooltip" tooltipText={<FormattedMessage id="contractInteraction.removeContract" />}>
            <i className="fas fa-times p-2" aria-hidden="true" data-id="universalDappUiUdappClose" onClick={removeContract}></i>
          </CustomTooltip>
        </div>
      </div>
      <div className="udapp_cActionsWrapper" data-id="universalDappUiContractActionWrapper">
        <div className="udapp_contractActionsContainer">
          <div className="d-flex flex-row justify-content-between align-items-center pb-2" data-id="instanceContractBal">
            <span className="remixui_runtabBalancelabel run-tab">
              <b><FormattedMessage id="contractInteraction.balance" />:</b> {instanceBalance.toString()} ETH
            </span>
          </div>
          {props.instance.isPinned && props.instance.pinnedTimestamp && (
            <div className="d-flex" data-id="instanceContractPinnedAt">
              <label>
                <b><FormattedMessage id="contractInteraction.pinnedTimestamp" />:</b> {(new Date(props.instance.pinnedTimestamp)).toLocaleString()}
              </label>
            </div>
          )}

          {/* READ tab */}
          {props.instance.abi.Read && props.instance.abi.Read.length > 0 && (
            <ReadWriteFunctions
              // TODO
              // runTransactions={props.runTransactions}
              // sendValue={props.sendValue}
              // gasEstimationPrompt={props.gasEstimationPrompt}
              // passphrasePrompt={props.passphrasePrompt}
              // key={index}
              // removeInstance={props.removeInstance}
              // index={index}
              // mainnetPrompt={props.mainnetPrompt}
              // getVersion={props.getVersion}
              // runTabState={props.runTabState}
              // funcABI={funcABI}
              instance={props.instance}
              getFuncABIInputs={props.getFuncABIInputs}
              exEnvironment={props.exEnvironment}
              editInstance={props.editInstance}
              solcVersion={props.solcVersion}
              evmCheckComplete={props.evmCheckComplete}
              contractABI={{ category: ABICategory.Read, abi: props.instance.abi.Read }} index={0}
            />
          )}
          {/* WRITE tab */}
          {props.instance.abi.Write && props.instance.abi.Write.length > 0 && (
            <ReadWriteFunctions
              instance={props.instance}
              getFuncABIInputs={props.getFuncABIInputs}
              exEnvironment={props.exEnvironment}
              editInstance={props.editInstance}
              solcVersion={props.solcVersion}
              evmCheckComplete={props.evmCheckComplete}
              contractABI={{ category: ABICategory.Write, abi: props.instance.abi.Write }} index={1}
            />
          )}
          {/* PROXY_READ tab*/}
          {props.instance.abi.ProxyRead && props.instance.abi.ProxyRead.length > 0 && (
            <ReadWriteFunctions
              instance={props.instance}
              getFuncABIInputs={props.getFuncABIInputs}
              exEnvironment={props.exEnvironment}
              editInstance={props.editInstance}
              solcVersion={props.solcVersion}
              evmCheckComplete={props.evmCheckComplete}
              contractABI={{ category: ABICategory.ProxyRead, abi: props.instance.abi.ProxyRead }} index={2}
            />
          )}
          {/* PROXY_WRITE tab*/}
          {props.instance.abi.ProxyWrite && props.instance.abi.ProxyWrite.length > 0 && (
            <ReadWriteFunctions
              instance={props.instance}
              getFuncABIInputs={props.getFuncABIInputs}
              exEnvironment={props.exEnvironment}
              editInstance={props.editInstance}
              solcVersion={props.solcVersion}
              evmCheckComplete={props.evmCheckComplete}
              contractABI={{ category: ABICategory.ProxyWrite, abi: props.instance.abi.ProxyWrite }} index={3}
            />
          )}
        </div>
        <div className="d-flex flex-column">
          <div className="d-flex flex-row justify-content-between mt-2">
            <div className="py-2 border-top d-flex justify-content-start flex-grow-1">
              <FormattedMessage id="contractInteraction.lowLevelInteractions" />
            </div>
            <CustomTooltip
              placement={'bottom-end'}
              tooltipClasses="text-wrap"
              tooltipId="docsForReceiveAndFallbackTooltip"
              tooltipText={<FormattedMessage id="contractInteraction.docsForReceiveAndFallback" />}
            >
              { // receive method added to solidity v0.6.x. use this as diff.
                props.solcVersion.canReceive === false ? (
                  <a href={`https://solidity.readthedocs.io/en/v${props.solcVersion.version}/contracts.html`} target="_blank" rel="noreferrer">
                    <i aria-hidden="true" className="fas fa-info my-2 mr-1"></i>
                  </a>
                ) : <a href={`https://solidity.readthedocs.io/en/v${props.solcVersion.version}/contracts.html#receive-ether-function`} target="_blank" rel="noreferrer">
                  <i aria-hidden="true" className="fas fa-info my-2 mr-1"></i>
                </a>
              }
            </CustomTooltip>
          </div>
          <div className="d-flex flex-column align-items-start">
            <label className="">CALLDATA</label>
            <div className="d-flex justify-content-end w-100 align-items-center">
              <CustomTooltip
                placement="bottom"
                tooltipClasses="text-nowrap"
                tooltipId="deployAndRunLLTxCalldataInputTooltip"
                tooltipText={<FormattedMessage id="contractInteraction.sendRawCalldata" />}
              >
                <input id="deployAndRunLLTxCalldata" onChange={handleCalldataChange} className="udapp_calldataInput form-control" />
              </CustomTooltip>
              <CustomTooltip placement="right" tooltipClasses="text-nowrap" tooltipId="deployAndRunLLTxCalldataTooltip" tooltipText={<FormattedMessage id="contractInteraction.sendRawTransaction" />}>
                <button
                  id="deployAndRunLLTxSendTransaction"
                  data-id="pluginManagerSettingsDeployAndRunLLTxSendTransaction"
                  className="btn udapp_instanceButton p-0 w-50 border-warning text-warning"
                  onClick={sendRawData}
                >
                  Transact
                </button>
              </CustomTooltip>
            </div>
          </div>
          <div>
            <label id="deployAndRunLLTxError" className="text-danger my-2">
              {llIError}
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
