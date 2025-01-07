import { useContext, useEffect, useRef, useState } from 'react'
import { ethers } from 'ethers'

import { AppContext } from '../AppContext'
import { ContractDropdownSelection } from './ContractDropdown'

interface ConstructorArgumentsProps {
  abiEncodedConstructorArgs: string
  setAbiEncodedConstructorArgs: React.Dispatch<React.SetStateAction<string>>
  abiEncodingError: string
  setAbiEncodingError: React.Dispatch<React.SetStateAction<string>>
  selectedContract: ContractDropdownSelection
}

export const ConstructorArguments: React.FC<ConstructorArgumentsProps> = ({ abiEncodedConstructorArgs, setAbiEncodedConstructorArgs, abiEncodingError, setAbiEncodingError, selectedContract }) => {
  return (<></>)

  // const { compilationOutput } = useContext(AppContext)
  // const [toggleRawInput, setToggleRawInput] = useState<boolean>(false)

  // const { triggerFilePath, filePath, contractName } = selectedContract
  // const selectedCompilerAbstract = triggerFilePath && compilationOutput[triggerFilePath]
  // const compiledContract = selectedCompilerAbstract?.data?.contracts?.[filePath]?.[contractName]
  // const abi = compiledContract?.abi

  // const constructorArgs = abi && abi.find((a) => a.type === 'constructor')?.inputs

  // const decodeConstructorArgs = (value: string) => {
  //   try {
  //     const decodedObj = ethers.utils.defaultAbiCoder.decode(
  //       constructorArgs.map((inp) => inp.type),
  //       value
  //     )
  //     const decoded = decodedObj.map((val) => JSON.stringify(val))
  //     return { decoded, errorMessage: '' }
  //   } catch (e) {
  //     console.error(e)
  //     const errorMessage = 'Decoding error: ' + e.message
  //     const decoded = Array(constructorArgs?.length ?? 0).fill('')
  //     return { decoded, errorMessage }
  //   }
  // }

  // const [constructorArgsValues, setConstructorArgsValues] = useState<string[]>(abiEncodedConstructorArgs ? decodeConstructorArgs(abiEncodedConstructorArgs).decoded : Array(constructorArgs?.length ?? 0).fill(''))

  // const constructorArgsInInitialState = useRef(true)
  // useEffect(() => {
  //   if (constructorArgsInInitialState.current) {
  //     constructorArgsInInitialState.current = false
  //     return
  //   }
  //   setAbiEncodedConstructorArgs('')
  //   setAbiEncodingError('')
  //   setConstructorArgsValues(Array(constructorArgs?.length ?? 0).fill(''))
  // }, [constructorArgs])

  // const handleConstructorArgs = (value: string, index: number) => {
  //   const changedConstructorArgsValues = [...constructorArgsValues.slice(0, index), value, ...constructorArgsValues.slice(index + 1)]
  //   setConstructorArgsValues(changedConstructorArgsValues)

  //   // if any constructorArgsValue is falsey (empty etc.), don't encode yet
  //   if (changedConstructorArgsValues.some((value) => !value)) {
  //     setAbiEncodedConstructorArgs('')
  //     setAbiEncodingError('')
  //     return
  //   }

  //   const types = constructorArgs.map((inp) => inp.type)
  //   const parsedArgsValues = []
  //   for (const arg of changedConstructorArgsValues) {
  //     try {
  //       parsedArgsValues.push(JSON.parse(arg))
  //     } catch (e) {
  //       parsedArgsValues.push(arg)
  //     }
  //   }

  //   try {
  //     const newAbiEncoding = ethers.utils.defaultAbiCoder.encode(types, parsedArgsValues)
  //     setAbiEncodedConstructorArgs(newAbiEncoding)
  //     setAbiEncodingError('')
  //   } catch (e) {
  //     console.error(e)
  //     setAbiEncodedConstructorArgs('')
  //     setAbiEncodingError('Encoding error: ' + e.message)
  //   }
  // }

  // const handleRawConstructorArgs = (value: string) => {
  //   setAbiEncodedConstructorArgs(value)
  //   const { decoded, errorMessage } = decodeConstructorArgs(value)
  //   setConstructorArgsValues(decoded)
  //   setAbiEncodingError(errorMessage)
  // }

  // if (!selectedContract) return null
  // if (!compilationOutput && Object.keys(compilationOutput).length === 0) return null
  // // No render if no constructor args
  // if (!constructorArgs || constructorArgs.length === 0) return null

  // return (
  //   <div className="mt-4">
  //     <label>Constructor Arguments</label>
  //     <div className="d-flex py-1 align-items-center custom-control custom-checkbox">
  //       <input className="form-check-input custom-control-input" type="checkbox" id="toggleRawInputSwitch" checked={toggleRawInput} onChange={() => setToggleRawInput(!toggleRawInput)} />
  //       <label className="m-0 form-check-label custom-control-label" style={{ paddingTop: '2px' }} htmlFor="toggleRawInputSwitch">
  //         Enter raw ABI-encoded constructor arguments
  //       </label>
  //     </div>
  //     {toggleRawInput ? (
  //       <div>
  //         {' '}
  //         <textarea className="form-control" rows={5} placeholder="0x00000000000000000000000000000000d41867734bbee4c6863d9255b2b06ac1..." value={abiEncodedConstructorArgs} onChange={(e) => handleRawConstructorArgs(e.target.value)} />
  //         {abiEncodingError && <div className="text-danger small">{abiEncodingError}</div>}
  //       </div>
  //     ) : (
  //       <div>
  //         {constructorArgs.map((inp, i) => (
  //           <div key={`constructor-arg-${inp.name}`} className="d-flex flex-row align-items-center justify-content-between mb-2">
  //             <div className="mr-2 small">{inp.name}</div>
  //             <input className="form-control w-50" placeholder={inp.type} value={constructorArgsValues[i] ?? ''} onChange={(e) => handleConstructorArgs(e.target.value, i)} />
  //           </div>
  //         ))}
  //         {abiEncodedConstructorArgs && (
  //           <div>
  //             <label className="form-check-label" htmlFor="rawAbiEncodingResult">
  //               ABI-encoded constructor arguments:
  //             </label>
  //             <textarea className="form-control" rows={5} disabled value={abiEncodedConstructorArgs} id="rawAbiEncodingResult" style={{ opacity: 0.5 }} />
  //           </div>
  //         )}
  //         {abiEncodingError && <div className="text-danger small">{abiEncodingError}</div>}
  //       </div>
  //     )}
  //   </div>
  // )
}
