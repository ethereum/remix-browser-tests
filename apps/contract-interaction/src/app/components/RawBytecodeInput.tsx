import React from 'react'
import { ethers } from 'ethers/'

interface RawBytecodeInputProps {
  rawBytecode: string
  setRawBytecode: (bytecode: string) => void
  rawBytecodeError: string | undefined
  setRawBytecodeError: (error: string) => void
}

export const RawBytecodeInput: React.FC<RawBytecodeInputProps> = ({ rawBytecode, setRawBytecode, rawBytecodeError, setRawBytecodeError }) => {
  const handleRawBytecodeChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const isValidHexString = ethers.utils.isHexString(event.target.value)
    setRawBytecode(event.target.value)
    if (!isValidHexString) {
      setRawBytecodeError('Invalid raw bytecode. Expect a hex string e.g. `0x1234...`')
      console.error('Invalid raw bytecode. Expect a hex string e.g. `0x1234...`')
      return
    }
    setRawBytecodeError(undefined)
  }

  return (
    <div className="form-group">
      <div>{rawBytecodeError && <div className="text-danger">{rawBytecodeError}</div>}</div>
      <textarea
        className="form-control"
        id="rawBytecodeInput"
        placeholder="0x2738d13E81e..."
        value={rawBytecode}
        onChange={(e) => handleRawBytecodeChange(e)}
      /></div>
  )
}
