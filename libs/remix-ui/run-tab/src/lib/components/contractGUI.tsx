// eslint-disable-next-line no-use-before-define
import React, { useEffect, useRef, useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import * as remixLib from '@remix-project/remix-lib'
import { ContractGUIProps } from '../types'
import { CopyToClipboard } from '@remix-ui/clipboard'
import { CustomTooltip, shortenDeploymentAddresses } from '@remix-ui/helper'

const txFormat = remixLib.execution.txFormat
const txHelper = remixLib.execution.txHelper
export function ContractGUI (props: ContractGUIProps) {
  const [title, setTitle] = useState<string>('')
  const [basicInput, setBasicInput] = useState<string>('')
  const [toggleContainer, setToggleContainer] = useState<boolean>(false)
  const [buttonOptions, setButtonOptions] = useState<{
    title: string,
    content: string,
    classList: string,
    dataId: string
  }>({ title: '', content: '', classList: '', dataId: '' })
  const [toggleDeployProxy, setToggleDeployProxy] = useState<boolean>(false)
  const [toggleUpgradeImp, setToggleUpgradeImp] = useState<boolean>(false)
  const [deployState, setDeployState] = useState<{ deploy: boolean, upgrade: boolean }>({ deploy: false, upgrade: false })
  const [proxyAddress, setProxyAddress] = useState<string>('')
  const [proxyAddressError, setProxyAddressError] = useState<string>('')
  const multiFields = useRef<Array<HTMLInputElement | null>>([])
  const initializeFields = useRef<Array<HTMLInputElement | null>>([])
  const basicInputRef = useRef<HTMLInputElement>()
  const intl = useIntl()

  useEffect(() => {
    if (props.deployOption && Array.isArray(props.deployOption)) {
      if (props.deployOption[0] && props.deployOption[0].title === 'Deploy with Proxy' && props.deployOption[0].active) handleDeployProxySelect(true)
      else if (props.deployOption[1] && props.deployOption[1].title === 'Upgrade with Proxy' && props.deployOption[1].active)  handleUpgradeImpSelect(true)
    }
  }, [props.deployOption])

  useEffect(() => {
    if (!proxyAddress && props.proxy && props.proxy.deployments.length > 0) {
      setProxyAddress(props.proxy.deployments[0].address)
    }
  }, [proxyAddress, props.proxy])

  useEffect(() => {
    if (props.title) {
      setTitle(props.title)
    } else if (props.funcABI.name) {
      setTitle(props.funcABI.name)
    } else {
      setTitle(props.funcABI.type === 'receive' ? '(receive)' : '(fallback)')
    }
    setBasicInput('')
    // we have the reset the fields before reseting the previous references.
    basicInputRef.current.value = ''
    multiFields.current.filter((el) => el !== null && el !== undefined).forEach((el) => el.value = '')
    multiFields.current = []
  }, [props.title, props.funcABI])

  useEffect(() => {
    if (props.lookupOnly) {
    //   // call. stateMutability is either pure or view
      setButtonOptions({
        title: title + ' - call',
        content: 'call',
        classList: 'btn-info',
        dataId: title + ' - call'
      })
    } else if (props.funcABI.stateMutability === 'payable' || props.funcABI.payable) {
    //   // transact. stateMutability = payable
      setButtonOptions({
        title: title + ' - transact (payable)',
        content: 'transact',
        classList: 'btn-danger',
        dataId: title + ' - transact (payable)'
      })
    } else {
    //   // transact. stateMutability = nonpayable
      setButtonOptions({
        title: title + ' - transact (not payable)',
        content: 'transact',
        classList: 'btn-warning',
        dataId: title + ' - transact (not payable)'
      })
    }
  }, [props.lookupOnly, props.funcABI, title])

  const getEncodedCall = () => {
    const multiString = getMultiValsString(multiFields.current)
    // copy-to-clipboard icon is only visible for method requiring input params
    if (!multiString) {
      return 'cannot encode empty arguments'
    }
    const multiJSON = JSON.parse('[' + multiString + ']')

    const encodeObj = txFormat.encodeData(
        props.funcABI,
        multiJSON,
        props.funcABI.type === 'constructor' ? props.evmBC : null)

    if (encodeObj.error) {
      console.error(encodeObj.error)
      return encodeObj.error
    } else {
      return encodeObj.data
    }
  }

  const getEncodedParams = () => {
    try {
      const multiString = getMultiValsString(multiFields.current)
      // copy-to-clipboard icon is only visible for method requiring input params
      if (!multiString) {
        return 'cannot encode empty arguments'
      }
      const multiJSON = JSON.parse('[' + multiString + ']')
      return txHelper.encodeParams(props.funcABI, multiJSON)
    } catch (e) {
      console.error(e)
    }
  }

  const switchMethodViewOn = () => {
    setToggleContainer(true)
    makeMultiVal()
  }

  const switchMethodViewOff = () => {
    setToggleContainer(false)
    const multiValString = getMultiValsString(multiFields.current)

    if (multiValString) setBasicInput(multiValString)
  }

  const getMultiValsString = (fields: HTMLInputElement[]) => {
    const valArray = fields
    let ret = ''
    const valArrayTest = []

    for (let j = 0; j < valArray.length; j++) {
      if (ret !== '') ret += ','
      let elVal = valArray[j] ? valArray[j].value : ''

      valArrayTest.push(elVal)
      elVal = elVal.replace(/(^|,\s+|,)(\d+)(\s+,|,|$)/g, '$1"$2"$3') // replace non quoted number by quoted number
      elVal = elVal.replace(/(^|,\s+|,)(0[xX][0-9a-fA-F]+)(\s+,|,|$)/g, '$1"$2"$3') // replace non quoted hex string by quoted hex string
      if (elVal) {
        try {
          JSON.parse(elVal)
        } catch (e) {
          elVal = '"' + elVal + '"'
        }
      }
      ret += elVal
    }
    const valStringTest = valArrayTest.join('')

    if (valStringTest) {
      return ret
    } else {
      return ''
    }
  }

  const makeMultiVal = () => {
    const inputString = basicInput

    if (inputString) {
      const inputJSON = remixLib.execution.txFormat.parseFunctionParams(inputString)
      const multiInputs = multiFields.current

      for (let k = 0; k < multiInputs.length; k++) {
        if (inputJSON[k]) {
          multiInputs[k].value = JSON.stringify(inputJSON[k])
        }
      }
    }
  }

  const handleActionClick = () => {
    if (deployState.deploy) {
      const proxyInitializeString = getMultiValsString(initializeFields.current)

      props.clickCallBack(props.initializerOptions.inputs.inputs, proxyInitializeString, ['Deploy with Proxy'])
    } else if (deployState.upgrade) {
      props.isValidProxyUpgrade(proxyAddress)
      !proxyAddressError && props.clickCallBack(props.funcABI.inputs, proxyAddress, ['Upgrade with Proxy'])
    } else {
      props.clickCallBack(props.funcABI.inputs, basicInput)
    }
  }

  const handleBasicInput = (e) => {
    const value = e.target.value

    setBasicInput(value)
  }

  const handleExpandMultiClick = () => {
    const valsString = getMultiValsString(multiFields.current)

    if (valsString) {
      props.clickCallBack(props.funcABI.inputs, valsString)
    } else {
      props.clickCallBack(props.funcABI.inputs, '')
    }
  }

  const handleToggleDeployProxy = () => {
    setToggleDeployProxy(!toggleDeployProxy)
  }

  const handleDeployProxySelect = (value: boolean) => {
    if (value) setToggleUpgradeImp(false)
    setToggleDeployProxy(value)
    setDeployState({ upgrade: false, deploy: value })
  }

  const handleToggleUpgradeImp = () => {
    setToggleUpgradeImp(!toggleUpgradeImp)
  }

  const handleUpgradeImpSelect = (value: boolean) => {
    setToggleUpgradeImp(value)
    if (value) {
      setToggleDeployProxy(false)
      // if (useLastProxy) setProxyAddress(props.savedProxyAddress)
    }
    setDeployState({ deploy: false, upgrade: value })
  }

  const handleSelectProxyAddress = (e) => {
    const value = e.target.value
    setProxyAddress(value)
  }

  const validateProxyAddress = async (address: string) => {
    if (address === '') {
      setProxyAddressError('proxy address cannot be empty')
    } else {
      if (await props.isValidProxyAddress(address)) {
        setProxyAddressError('')
      } else {
        setProxyAddressError('not a valid contract address')
      }
    }
  }

  return (
    <div
      className={`udapp_contractProperty ${
        (props.funcABI.inputs && props.funcABI.inputs.length > 0) ||
        props.funcABI.type === "fallback" ||
        props.funcABI.type === "receive"
          ? "udapp_hasArgs"
          : ""
      }`}
    >
      <div
        className="udapp_contractActionsContainerSingle pt-2"
        style={{ display: toggleContainer ? "none" : "flex" }}
      >
        <CustomTooltip
          placement={"right-start"}
          tooltipClasses="text-wrap"
          tooltipId="remixUdappInstanceButtonTooltip"
          tooltipText={buttonOptions.title}
        >
          <button
            onClick={handleActionClick}
            className={`udapp_instanceButton ${props.widthClass} btn btn-sm ${buttonOptions.classList}`}
            data-id={buttonOptions.dataId}
            data-title={buttonOptions.title}
          >
            {title}
          </button>
        </CustomTooltip>
        <CustomTooltip
          placement={"right"}
          tooltipClasses="text-nowrap"
          tooltipId="remixContractGuiTooltip"
          tooltipText={props.funcABI.type === "fallback" ||props.funcABI.type === "receive" ? `'(${props.funcABI.type}')`
          : props.inputs}
        >
          <input
            className="form-control"
            data-id={
              props.funcABI.type === "fallback" ||
              props.funcABI.type === "receive"
                ? `'(${props.funcABI.type}')`
                : "multiParamManagerBasicInputField"
            }
            placeholder={props.inputs}
            onChange={handleBasicInput}
            data-title={
              props.funcABI.type === "fallback" ||
              props.funcABI.type === "receive"
                ? `'(${props.funcABI.type}')`
                : props.inputs
            }
            ref={basicInputRef}
            style={{
              visibility: !(
                (props.funcABI.inputs && props.funcABI.inputs.length > 0) ||
                props.funcABI.type === "fallback" ||
                props.funcABI.type === "receive"
              )
                ? "hidden"
                : "visible",
            }}
          />
        </CustomTooltip>
          <i
            className="fas fa-angle-down udapp_methCaret"
            onClick={switchMethodViewOn}
            style={{
              visibility: !(
                props.funcABI.inputs && props.funcABI.inputs.length > 0
              )
                ? "hidden"
                : "visible",
            }}
          ></i>
      </div>
      <div
        className="udapp_contractActionsContainerMulti"
        style={{ display: toggleContainer ? "flex" : "none" }}
      >
        <div className="udapp_contractActionsContainerMultiInner text-dark">
          <div onClick={switchMethodViewOff} className="udapp_multiHeader">
            <div className="udapp_multiTitle run-instance-multi-title pt-3">
              {title}
            </div>
            <i className="fas fa-angle-up udapp_methCaret"></i>
          </div>
          <div>
            {props.funcABI.inputs.map((inp, index) => {
              return (
                <div className="udapp_multiArg" key={index}>
                  <label htmlFor={inp.name}> {inp.name}: </label>
                  <CustomTooltip
                    placement="left-end"
                    tooltipId="udappContractActionsTooltip"
                    tooltipClasses="text-nowrap"
                    tooltipText={inp.name}
                  >
                    <input
                      ref={(el) => {
                        multiFields.current[index] = el;
                      }}
                      className="form-control"
                      placeholder={inp.type}
                      data-id={`multiParamManagerInput${inp.name}`}
                    />
                  </CustomTooltip>
                </div>
              );
            })}
          </div>
          <div className="d-flex udapp_group udapp_multiArg">
            <CopyToClipboard
              tip={intl.formatMessage({ id: 'udapp.copyCalldata' })}
              icon="fa-clipboard"
              direction={"bottom"}
              getContent={getEncodedCall}
            >
              <button className="btn remixui_copyButton">
                <i
                  id="copyCalldata"
                  className="m-0 remixui_copyIcon far fa-copy"
                  aria-hidden="true"
                ></i>
                <label htmlFor="copyCalldata">Calldata</label>
              </button>
            </CopyToClipboard>
            <CopyToClipboard
              tip={intl.formatMessage({ id: 'udapp.copyParameters' })}
              icon="fa-clipboard"
              direction={"bottom"}
              getContent={getEncodedParams}
            >
              <button className="btn remixui_copyButton">
                <i
                  id="copyParameters"
                  className="m-0 remixui_copyIcon far fa-copy"
                  aria-hidden="true"
                ></i>
                <label htmlFor="copyParameters"><FormattedMessage id='udapp.parameters' /></label>
              </button>
            </CopyToClipboard>
            <CustomTooltip
              placement={"right"}
              tooltipClasses="text-nowrap"
              tooltipId="remixUdappInstanceButtonTooltip"
              tooltipText={buttonOptions.title}
            >
              <button
                type="button"
                onClick={handleExpandMultiClick}
                data-id={buttonOptions.dataId}
                className={`udapp_instanceButton ${buttonOptions.classList}`}
              >
                {buttonOptions.content}
              </button>
            </CustomTooltip>
          </div>
        </div>
      </div>
      {props.deployOption && (props.deployOption || []).length > 0 ? (
        <>
          <div className="d-flex justify-content-between mt-3">
            <div className="d-flex py-1 align-items-center custom-control custom-checkbox">
              <input
                id="deployWithProxy"
                data-id="contractGUIDeployWithProxy"
                className="form-check-input custom-control-input"
                type="checkbox"
                onChange={(e) => handleDeployProxySelect(e.target.checked)}
                checked={deployState.deploy}
              />
                <label
                  htmlFor="deployWithProxy"
                  data-id="contractGUIDeployWithProxyLabel"
                  className="m-0 form-check-label w-100 custom-control-label udapp_checkboxAlign"
                >
                  <FormattedMessage id='udapp.deployWithProxy' />
                </label>
            </div>
            <div>
              {props.initializerOptions &&
              props.initializerOptions.initializeInputs ? (
                <span onClick={handleToggleDeployProxy}>
                  <i
                    className={
                      !toggleDeployProxy
                        ? "fas fa-angle-right pt-2"
                        : "fas fa-angle-down"
                    }
                    aria-hidden="true"
                  ></i>
                </span>
              ) : null}
            </div>
          </div>
          {props.initializerOptions &&
          props.initializerOptions.initializeInputs ? (
            <div
              className={`pl-4 flex-column ${
                toggleDeployProxy ? "d-flex" : "d-none"
              }`}
            >
              <div className={`flex-column 'd-flex'}`}>
                {props.initializerOptions.inputs.inputs.map((inp, index) => {
                  return (
                    <div className="mb-2" key={index}>
                      <label
                        className="mt-2 text-left d-block"
                        htmlFor={inp.name}
                      >
                        {" "}
                        {inp.name}:{" "}
                      </label>
                        <input
                          ref={(el) => {
                            initializeFields.current[index] = el;
                          }}
                          style={{ height: 32 }}
                          className="form-control udapp_input"
                          placeholder={inp.type}
                        />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
          <div className="d-flex justify-content-between">
            <div className="d-flex py-1 align-items-center custom-control custom-checkbox">
              <input
                id="upgradeImplementation"
                data-id="contractGUIUpgradeImplementation"
                className="form-check-input custom-control-input"
                type="checkbox"
                onChange={(e) => handleUpgradeImpSelect(e.target.checked)}
                checked={deployState.upgrade}
              />
                <label
                  htmlFor="upgradeImplementation"
                  data-id="contractGUIUpgradeImplementationLabel"
                  className="m-0 form-check-label custom-control-label udapp_checkboxAlign"
                >
                  <FormattedMessage id='udapp.upgradeWithProxy' />
                </label>
            </div>
            <span onClick={handleToggleUpgradeImp}>
              <i
                className={
                  !toggleUpgradeImp
                    ? "fas fa-angle-right pt-2"
                    : "fas fa-angle-down"
                }
                aria-hidden="true"
              ></i>
            </span>
          </div>
          <div
            className={`pl-4 flex-column ${
              toggleUpgradeImp ? "d-flex" : "d-none"
            }`}
          >
            <div className={`flex-column 'd-flex'}`}>
                <div className="mb-2">
                  <select data-id="udappSelectProxyAddress" name="selectproxy" className="form-control udapp_select custom-select pr-4" value={proxyAddress} onChange={handleSelectProxyAddress}>
                    {
                      props.proxy.deployments.map((deployment, index) => <option value={deployment.address} key={index}>{ shortenDeploymentAddresses(deployment.address, deployment.date) }</option>)
                    }
                  </select>
                  { proxyAddressError && <span className='text-lowercase' data-id="errorMsgProxyAddress" style={{ fontSize: '.8em' }}>{ proxyAddressError }</span> }
                </div>
            </div>
          </div>
        </> 
      ) : null}
    </div>
  );
}
