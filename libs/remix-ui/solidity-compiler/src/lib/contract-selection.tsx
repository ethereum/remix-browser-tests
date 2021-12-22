import React, { useState, useEffect } from 'react' // eslint-disable-line
import { ContractSelectionProps } from './types'
import { PublishToStorage } from '@remix-ui/publish-to-storage' // eslint-disable-line
import { TreeView, TreeViewItem } from '@remix-ui/tree-view' // eslint-disable-line
import { CopyToClipboard } from '@remix-ui/clipboard' // eslint-disable-line

import './css/style.css'

export const ContractSelection = (props: ContractSelectionProps) => {
  const { api, contractMap, contractsDetails, modal } = props
  const [contractList, setContractList] = useState([])
  const [selectedContract, setSelectedContract] = useState('')
  const [storage, setStorage] = useState(null)

  useEffect(() => {
    const contractList = contractMap ? Object.keys(contractMap).map((key) => ({
      name: key,
      file: getFileName(contractMap[key].file)
    })) : []

    setContractList(contractList)
    if (contractList.length) setSelectedContract(contractList[0].name)
  }, [contractMap, contractsDetails])

  const resetStorage = () => {
    setStorage('')
  }

  // Return the file name of a path: ex "browser/ballot.sol" -> "ballot.sol"
  const getFileName = (path) => {
    const part = path.split('/')

    return part[part.length - 1]
  }

  const handleContractChange = (contractName: string) => {
    setSelectedContract(contractName)
  }

  const handlePublishToStorage = (type) => {
    setStorage(type)
  }

  const copyABI = () => {
    return copyContractProperty('abi')
  }

  const copyContractProperty = (property) => {
    let content = getContractProperty(property)
    if (!content) {
      return
    }

    try {
      if (typeof content !== 'string') {
        content = JSON.stringify(content, null, '\t')
      }
    } catch (e) {}

    return content
  }

  const getContractProperty = (property) => {
    if (!selectedContract) throw new Error('No contract compiled yet')
    const contractProperties = contractsDetails[selectedContract]

    if (contractProperties && contractProperties[property]) return contractProperties[property]
    return null
  }

  const renderData = (item, key: string | number, keyPath: string) => {
    const data = extractData(item)
    const children = (data.children || []).map((child) => renderData(child.value, child.key, keyPath + '/' + child.key))

    if (children && children.length > 0) {
      return (
        <TreeViewItem id={`treeViewItem${key}`} key={keyPath} label={
          <div className="d-flex mt-2 flex-row remixui_label_item">
            <label className="small font-weight-bold pr-1 remixui_label_key">{ key }:</label>
            <label className="m-0 remixui_label_value">{ typeof data.self === 'boolean' ? `${data.self}` : data.self }</label>
          </div>
        }>
          <TreeView id={`treeView${key}`} key={keyPath}>
            {children}
          </TreeView>
        </TreeViewItem>
      )
    } else {
      return <TreeViewItem id={key.toString()} key={keyPath} label={
        <div className="d-flex mt-2 flex-row remixui_label_item">
          <label className="small font-weight-bold pr-1 remixui_label_key">{ key }:</label>
          <label className="m-0 remixui_label_value">{ typeof data.self === 'boolean' ? `${data.self}` : data.self }</label>
        </div>
      } />
    }
  }

  const extractData = (item) => {
    const ret = { children: null, self: null }

    if (item instanceof Array) {
      ret.children = item.map((item, index) => ({ key: index, value: item }))
      ret.self = ''
    } else if (item instanceof Object) {
      ret.children = Object.keys(item).map((key) => ({ key: key, value: item[key] }))
      ret.self = ''
    } else {
      ret.self = item
      ret.children = []
    }
    return ret
  }

  const insertValue = (details, propertyName) => {
    let node
    if (propertyName === 'web3Deploy' || propertyName === 'name' || propertyName === 'Assembly') {
      node = <pre>{ details[propertyName] }</pre>
    } else if (details[propertyName] && (propertyName === 'abi' || propertyName === 'metadata')) {
      if (details[propertyName] !== '') {
        try {
          node = <div>
            { (typeof details[propertyName] === 'object')
              ? <TreeView id="treeView">
                {
                  Object.keys(details[propertyName]).map((innerkey) => renderData(details[propertyName][innerkey], innerkey, innerkey))
                }
              </TreeView> : <TreeView id="treeView">
                {
                  Object.keys(JSON.parse(details[propertyName])).map((innerkey) => renderData(JSON.parse(details[propertyName])[innerkey], innerkey, innerkey))
                }
              </TreeView>
            }
          </div> // catch in case the parsing fails.
        } catch (e) {
          node = <div>Unable to display "${propertyName}": ${e.message}</div>
        }
      } else {
        node = <div> - </div>
      }
    } else {
      node = <div>{JSON.stringify(details[propertyName], null, 4)}</div>
    }
    return <pre className="remixui_value">{node || ''}</pre>
  }

  const details = () => {
    if (!selectedContract) throw new Error('No contract compiled yet')

    const help = {
      Assembly: 'Assembly opcodes describing the contract including corresponding solidity source code',
      Opcodes: 'Assembly opcodes describing the contract',
      'Runtime Bytecode': 'Bytecode storing the state and being executed during normal contract call',
      bytecode: 'Bytecode being executed during contract creation',
      functionHashes: 'List of declared function and their corresponding hash',
      gasEstimates: 'Gas estimation for each function call',
      metadata: 'Contains all informations related to the compilation',
      metadataHash: 'Hash representing all metadata information',
      abi: 'ABI: describing all the functions (input/output params, scope, ...)',
      name: 'Name of the compiled contract',
      swarmLocation: 'Swarm url where all metadata information can be found (contract needs to be published first)',
      web3Deploy: 'Copy/paste this code to any JavaScript/Web3 console to deploy this contract'
    }
    const contractProperties = contractsDetails[selectedContract] || {}
    const log = <div className="remixui_detailsJSON">
      <TreeView>
        {
          Object.keys(contractProperties).map((propertyName, index) => {
            const copyDetails = <span className="remixui_copyDetails"><CopyToClipboard content={contractProperties[propertyName]} direction='top' /></span>
            const questionMark = <span className="remixui_questionMark"><i title={ help[propertyName] } className="fas fa-question-circle" aria-hidden="true"></i></span>

            return (
              <div className="remixui_log" key={index}>
                <TreeViewItem
                  label={
                    <div data-id={`remixui_treeviewitem_${propertyName}`} className="remixui_key">{ propertyName } { copyDetails } { questionMark }</div>
                  }>
                  { insertValue(contractProperties, propertyName) }
                </TreeViewItem>
              </div>
            )
          })
        }
      </TreeView>
    </div>

    modal(selectedContract, log, 'Close', null)
  }

  const copyBytecode = () => {
    return copyContractProperty('bytecode')
  }

  return (
    // define swarm logo
    <>
      { contractList.length
        ? <section className="remixui_compilerSection pt-3">
          {/* Select Compiler Version */}
          <div className="mb-3">
            <label className="remixui_compilerLabel form-check-label" htmlFor="compiledContracts">Contract</label>
            <select onChange={(e) => handleContractChange(e.target.value)} value={selectedContract} data-id="compiledContracts" id="compiledContracts" className="custom-select">
              { contractList.map(({ name, file }, index) => <option value={name} key={index}>{name} ({file})</option>)}
            </select>
          </div>
          <article className="mt-2 pb-0">
            <button id="publishOnIpfs" className="btn btn-secondary btn-block" title="Publish on Ipfs" onClick={() => { handlePublishToStorage('ipfs') }}>
              <span>Publish on Ipfs(Crust)</span>
              <img id="ipfsLogo" className="remixui_storageLogo ml-2" src="assets/img/ipfs.webp" />
            </button>
            <button data-id="compilation-details" className="btn btn-secondary btn-block" title="Display Contract Details" onClick={() => { details() }}>
              Compilation Details
            </button>
            {/* Copy to Clipboard */}
            <div className="remixui_contractHelperButtons">
              <div className="input-group">
                <div className="btn-group" role="group" aria-label="Copy to Clipboard">
                  <CopyToClipboard title="Copy ABI to clipboard" content={copyABI()} direction='top'>
                    <button className="btn remixui_copyButton" title="Copy ABI to clipboard">
                      <i className="remixui_copyIcon far fa-copy" aria-hidden="true"></i>
                      <span>ABI</span>
                    </button>
                  </CopyToClipboard>
                  <CopyToClipboard title="Copy ABI to clipboard" content={copyBytecode()} direction='top'>
                    <button className="btn remixui_copyButton" title="Copy Bytecode to clipboard">
                      <i className="remixui_copyIcon far fa-copy" aria-hidden="true"></i>
                      <span>Bytecode</span>
                    </button>
                  </CopyToClipboard>
                </div>
              </div>
            </div>
          </article>
        </section> : <section className="remixui_container clearfix"><article className="px-2 mt-2 pb-0 d-flex w-100">
          <span className="mt-2 mx-3 w-100 alert alert-warning" role="alert">No Contract Compiled Yet</span>
        </article></section>
      }
      <PublishToStorage api={api} storage={storage} contract={contractsDetails[selectedContract]} resetStorage={resetStorage} />
    </>
  )
}

export default ContractSelection
