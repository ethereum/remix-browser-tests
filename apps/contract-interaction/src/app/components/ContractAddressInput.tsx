import React from 'react'
import { ethers } from 'ethers/'

interface ContractAddressInputProps {
  contractAddress: string
  setContractAddress: (address: string) => void
  contractAddressError: string
  setContractAddressError: (error: string) => void
}

// Chooses one contract from the compilation output.
export const ContractAddressInput: React.FC<ContractAddressInputProps> = ({ contractAddress, setContractAddress, contractAddressError, setContractAddressError }) => {
  const handleAddressChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isValidAddress = ethers.utils.isAddress(event.target.value)
    setContractAddress(event.target.value)
    if (!isValidAddress) {
      setContractAddressError('Invalid contract address')
      console.error('Invalid contract address')
      return
    }
    setContractAddressError('')
  }

  return (
    <div className="form-group">
      <div>{contractAddressError && <div className="text-danger">{contractAddressError}</div>}</div>
      <input type="text" className="form-control" id="contractAddressInput" placeholder="0x2738d13E81e..." value={contractAddress} onChange={handleAddressChange} />
    </div>
  )
}
