import {Language} from "@remix-project/remix-solidity-ts";

export function compilerInput (contracts) {
  return JSON.stringify({
    language: 'Solidity',
    sources: {
      'test.sol': {
        content: contracts
      }
    },
    settings: {
      optimizer: {
        enabled: false,
        runs: 200
      },
      outputSelection: {
        '*': {
          '': ['ast'],
          '*': ['abi', 'metadata', 'evm.legacyAssembly', 'evm.bytecode', 'evm.deployedBytecode', 'evm.methodIdentifiers', 'evm.gasEstimates']
        }
      }
    }
  })
}

export const Languages = ['Solidity', 'Yul']

export function getValidLanguage (val: string): Language {
  if (val !== undefined && val !== null && val) {
    const lang = val.slice(0, 1).toUpperCase() + val.slice(1).toLowerCase()
    return Languages.indexOf(lang) > -1 ? lang as Language : null
  }
  return null
}
