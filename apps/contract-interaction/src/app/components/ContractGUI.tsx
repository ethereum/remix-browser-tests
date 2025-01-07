import React, { useEffect, useRef, useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import * as remixLib from '@remix-project/remix-lib'
import { CopyToClipboard } from '@remix-ui/clipboard'
import { CustomTooltip, ProxyAddressToggle, ProxyDropdownMenu, shortenDate, shortenProxyAddress, unavailableProxyLayoutMsg, upgradeReportMsg } from '@remix-ui/helper'
import { FuncABI } from '@remix-project/core-plugin'
// import { getCompatibleChains, isChainCompatible, isChainCompatibleWithAnyFork } from '../actions/evmmap'

const txHelper = remixLib.execution.txHelper;
const txFormat = remixLib.execution.txFormat;

export interface ContractGUIProps {
  // TODO
  // getCompilerDetails: () => Promise<CheckStatus>
  // plugin: RunTab,
  // runTabState: RunTabState
  // clickCallBack: (inputs: { name: string, type: string }[], input: string, deployMode?: DeployMode[]) => void,
  // deployOption?: { title: DeployMode, active: boolean }[],
  // initializerOptions?: DeployOption,
  // isValidProxyUpgrade?: (proxyAddress: string) => Promise<LayoutCompatibilityReport | { ok: boolean, pass: boolean, warning: boolean }>,
  // getVersion: () => void

  evmCheckComplete?: boolean,
  setEvmCheckComplete?: React.Dispatch<React.SetStateAction<boolean>>,
  title?: string,
  funcABI: FuncABI,
  inputs: string,
  widthClass?: string,
  evmBC: any,
  lookupOnly: boolean,
  disabled?: boolean,
  proxy?: { deployments: { address: string, date: string, contractName: string }[] },
  isValidProxyAddress?: (address: string) => Promise<boolean>,
  modal?: (title: string, message: string | JSX.Element, okLabel: string, okFn: () => void, cancelLabel?: string, cancelFn?: () => void, okBtnClass?: string, cancelBtnClass?: string) => void
  solcVersion?: { version: string, canReceive: boolean }
  setSolcVersion?: React.Dispatch<React.SetStateAction<{
    version: string;
    canReceive: boolean;
  }>>
}

export function ContractGUI(props: ContractGUIProps) {

  const [title, setTitle] = useState<string>('')
  const [basicInput, setBasicInput] = useState<string>('')
  const [toggleContainer, setToggleContainer] = useState<boolean>(false)
  const [buttonOptions, setButtonOptions] = useState<{
    title: string
    content: string
    classList: string
    dataId: string
  }>({ title: '', content: '', classList: '', dataId: '' })
  const [toggleUpgradeImp, setToggleUpgradeImp] = useState<boolean>(false)
  const [proxyAddress, setProxyAddress] = useState<string>('')
  const [proxyAddressError, setProxyAddressError] = useState<string>('')
  const [showDropdown, setShowDropdown] = useState<boolean>(false)
  const multiFields = useRef<Array<HTMLInputElement | null>>([])
  const initializeFields = useRef<Array<HTMLInputElement | null>>([])
  const basicInputRef = useRef<HTMLInputElement>()

  const intl = useIntl()
  // useEffect(() => {
  //   if (props.deployOption && Array.isArray(props.deployOption)) {
  //     if (props.deployOption[0] && props.deployOption[0].title === 'Deploy with Proxy' && props.deployOption[0].active) handleDeployProxySelect(true)
  //     else if (props.deployOption[1] && props.deployOption[1].title === 'Upgrade with Proxy' && props.deployOption[1].active) handleUpgradeImpSelect(true)
  //   }
  // }, [props.deployOption])

  useEffect(() => {
    if (props.title) {
      setTitle(props.title)
    } else if (props.funcABI.name) {
      setTitle(props.funcABI.name)
    } else {
      setTitle(props.funcABI.type === 'receive' ? '(receive)' : '(fallback)')
    }
    setBasicInput('')
    // we have the reset the fields before resetting the previous references.
    basicInputRef.current.value = ''
    multiFields.current.filter((el) => el !== null && el !== undefined).forEach((el) => (el.value = ''))
    multiFields.current = []
  }, [props.title, props.funcABI])

  useEffect(() => {
    if (props.lookupOnly) {
      //   call. stateMutability is either pure or view
      setButtonOptions({
        title: title + ' - call',
        content: 'call',
        classList: 'btn-info',
        dataId: title + ' - call'
      })
    } else if (props.funcABI.stateMutability === 'payable' || props.funcABI.payable) {
      //    transact. stateMutability = payable
      setButtonOptions({
        title: title + ' - transact (payable)',
        content: 'transact',
        classList: 'btn-danger',
        dataId: title + ' - transact (payable)'
      })
    } else {
      //    transact. stateMutability = nonpayable
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
      return intl.formatMessage({ id: 'udapp.getEncodedCallError' })
    }
    const multiJSON = JSON.parse('[' + multiString + ']')

    const encodeObj = txFormat.encodeData(props.funcABI, multiJSON, props.funcABI.type === 'constructor' ? props.evmBC : null)

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
        return intl.formatMessage({ id: 'udapp.getEncodedCallError' })
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

  const handleReadWriteContract = async () => {
    console.log("not implemented yet")

    // props.clickCallBack(props.funcABI.inputs, basicInput)
    // if (deployState.deploy) {
    //   const proxyInitializeString = getMultiValsString(initializeFields.current)
    //   props.clickCallBack(props.initializerOptions.inputs.inputs, proxyInitializeString, ['Deploy with Proxy'])
    // } else if (deployState.upgrade) {
    //   if (proxyAddress === '') {
    //     setProxyAddressError(intl.formatMessage({ id: 'udapp.proxyAddressError1' }))
    //   } else {
    //     const isValidProxyAddress = await props.isValidProxyAddress(proxyAddress)
    //     if (isValidProxyAddress) {
    //       setProxyAddressError('')
    //       const upgradeReport: any = await props.isValidProxyUpgrade(proxyAddress)
    //       if (upgradeReport.ok) {
    //         !proxyAddressError && props.clickCallBack(props.funcABI.inputs, proxyAddress, ['Upgrade with Proxy'])
    //       } else {
    //         if (upgradeReport.warning) {
    //           props.modal(
    //             'Proxy Upgrade Warning',
    //             unavailableProxyLayoutMsg(),
    //             'Proceed',
    //             () => {
    //               !proxyAddressError && props.clickCallBack(props.funcABI.inputs, proxyAddress, ['Upgrade with Proxy'])
    //             },
    //             'Cancel',
    //             () => {},
    //             'btn-warning',
    //             'btn-secondary'
    //           )
    //         } else {
    //           props.modal(
    //             'Proxy Upgrade Error',
    //             upgradeReportMsg(upgradeReport),
    //             'Continue anyway ',
    //             () => {
    //               !proxyAddressError && props.clickCallBack(props.funcABI.inputs, proxyAddress, ['Upgrade with Proxy'])
    //             },
    //             'Cancel',
    //             () => {},
    //             'btn-warning',
    //             'btn-secondary'
    //           )
    //         }
    //       }
    //     } else {
    //       setProxyAddressError(intl.formatMessage({ id: 'udapp.proxyAddressError2' }))
    //     }
    //   }
    // } else {
    //   props.clickCallBack(props.funcABI.inputs, basicInput)
    // }
  }

  const handleActionClick = async () => {
    console.error("not implemented")
    // props.getVersion()
    // if (props.runTabState.selectExEnv.toLowerCase().startsWith('vm-') || props.runTabState.selectExEnv.toLowerCase().includes('basic-http-provider') || props.runTabState.contracts.loadType !== 'sol') {
    //   await handleDeploy()
    // } else {
    //   const status = await props.getCompilerDetails()
    //   if (status === 'Not Found') {
    //     await handleDeploy()
    //     return
    //   }
    //   const tabState = props.runTabState
    //   const compilerState = await props.plugin.call('solidity', 'getCompilerState')
    //   const IsCompatible = isChainCompatible(compilerState.evmVersion ?? 'cancun', parseInt(tabState.chainId))
    //   if (status === 'Passed' && IsCompatible) {
    //     await handleDeploy()
    //   } else {
    //     // Show log in browser console in case of failure due to unknown reasons
    //     console.log('Failed to run because of EVM version incomaptibility or some other compiler issue')
    //   }
    // }
  }

  const handleBasicInput = (e) => {
    const value = e.target.value

    setBasicInput(value)
  }

  const handleExpandMultiClick = () => {
    const valsString = getMultiValsString(multiFields.current)

    console.error("not implemented")

    // if (valsString) {
    //   props.clickCallBack(props.funcABI.inputs, valsString)
    // } else {
    //   props.clickCallBack(props.funcABI.inputs, '')
    // }
  }

  return (
    <div
      className={`udapp_contractProperty ${(props.funcABI.inputs && props.funcABI.inputs.length > 0) || props.funcABI.type === 'fallback' || props.funcABI.type === 'receive' ? 'udapp_hasArgs' : ''
        }`}
    >
      <div className="udapp_contractActionsContainerSingle pt-2" style={{ display: toggleContainer ? 'none' : 'flex' }}>
        <CustomTooltip
          delay={0}
          placement={'auto-end'}
          tooltipClasses="text-wrap"
          tooltipId="remixUdappInstanceButtonTooltip"
          tooltipText={
            toggleUpgradeImp && !proxyAddress
              ? intl.formatMessage({ id: 'udapp.tooltipText11' })
              : props.inputs !== '' && basicInput === ''
                ? intl.formatMessage({ id: 'udapp.tooltipText12' })
                : buttonOptions.title
          }
        >
          <div className="d-flex p-0 wrapperElement" onClick={handleReadWriteContract} data-id={buttonOptions.dataId} data-title={buttonOptions.title}>
            <button
              className={`udapp_instanceButton text-nowrap overflow-hidden text-truncate ${props.widthClass} btn btn-sm ${buttonOptions.classList}`}
              data-id={`${buttonOptions.dataId}`}
              data-title={`${buttonOptions.title}`}
              disabled={(toggleUpgradeImp && !proxyAddress) || props.disabled || (props.inputs !== '' && basicInput === '')}
            >
              {title}
            </button>
          </div>
        </CustomTooltip>
        <input
          className="form-control"
          data-id={props.funcABI.type === 'fallback' || props.funcABI.type === 'receive' ? `'(${props.funcABI.type}')` : 'multiParamManagerBasicInputField'}
          placeholder={props.inputs}
          onChange={handleBasicInput}
          data-title={props.funcABI.type === 'fallback' || props.funcABI.type === 'receive' ? `'(${props.funcABI.type}')` : props.inputs}
          ref={basicInputRef}
          style={{
            height: '2rem',
            visibility: !((props.funcABI.inputs && props.funcABI.inputs.length > 0) || props.funcABI.type === 'fallback' || props.funcABI.type === 'receive') ? 'hidden' : 'visible'
          }}
        />
        <i
          className="fas fa-angle-down udapp_methCaret"
          onClick={switchMethodViewOn}
          style={{
            visibility: !(props.funcABI.inputs && props.funcABI.inputs.length > 0) ? 'hidden' : 'visible'
          }}
        ></i>
      </div>
      <div className="udapp_contractActionsContainerMulti" style={{ display: toggleContainer ? 'flex' : 'none' }}>
        <div className="udapp_contractActionsContainerMultiInner text-dark">
          <div onClick={switchMethodViewOff} className="udapp_multiHeader">
            <div className="udapp_multiTitle run-instance-multi-title pt-3">{title}</div>
            <i className="fas fa-angle-up udapp_methCaret"></i>
          </div>
          <div>
            {props.funcABI.inputs.map((inp, index) => {
              return (
                <div className="udapp_multiArg" key={index}>
                  <label htmlFor={inp.name}> {inp.name}: </label>
                  <CustomTooltip placement="left-end" tooltipId="udappContractActionsTooltip" tooltipClasses="text-nowrap" tooltipText={inp.name}>
                    <input
                      ref={(el) => {
                        multiFields.current[index] = el
                      }}
                      className="form-control"
                      placeholder={inp.type}
                      data-id={`multiParamManagerInput${inp.name}`}
                      onChange={handleBasicInput}
                    />
                  </CustomTooltip>
                </div>
              )
            })}
          </div>
          <div className="d-flex udapp_group udapp_multiArg">
            <CopyToClipboard tip={intl.formatMessage({ id: 'udapp.copyCalldata' })} icon="fa-clipboard" direction={'bottom'} getContent={getEncodedCall}>
              <button className="btn remixui_copyButton">
                <i id="copyCalldata" className="m-0 remixui_copyIcon far fa-copy" aria-hidden="true"></i>
                <label htmlFor="copyCalldata">Calldata</label>
              </button>
            </CopyToClipboard>
            <CopyToClipboard tip={intl.formatMessage({ id: 'udapp.copyParameters' })} icon="fa-clipboard" direction={'bottom'} getContent={getEncodedParams}>
              <button className="btn remixui_copyButton">
                <i id="copyParameters" className="m-0 remixui_copyIcon far fa-copy" aria-hidden="true"></i>
                <label htmlFor="copyParameters">
                  <FormattedMessage id="contractInteraction.parameters" />
                </label>
              </button>
            </CopyToClipboard>
            <CustomTooltip placement={'auto-end'} tooltipClasses="text-nowrap" tooltipId="remixUdappInstanceButtonTooltip" tooltipText={buttonOptions.title}>
              <div onClick={handleExpandMultiClick}>
                <button
                  type="button"
                  data-id={buttonOptions.dataId}
                  className={`udapp_instanceButton btn ${buttonOptions.classList} text-center d-flex justify-content-center align-items-center`}
                  disabled={props.disabled || (props.inputs !== '' && basicInput === '')}
                >
                  <div className="text-center d-flex justify-content-center align-items-center">
                    {buttonOptions.content}
                  </div>
                </button>
              </div>
            </CustomTooltip>
          </div>
        </div>
      </div>
    </div>
  )
}
