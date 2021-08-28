export const allPrograms = [
  { ethers: 'The ethers.js library is a compact and complete JavaScript library for Ethereum.' },
  { remix: 'Ethereum IDE and tools for the web.' },
  { web3: 'The web3.js library is a collection of modules which contain specific functionality for the ethereum ecosystem.' }
  // { swarmgw: 'This library can be used to upload/download files to Swarm via https://swarm-gateways.net/.' }
]

export const allCommands = [
  // { 'remix.execute(filepath)': 'Run the script specified by file path. If filepath is empty, script currently displayed in the editor is executed.' },
  { 'remix.exeCurrent()': 'Run the script currently displayed in the editor.' },
  // { 'remix.help()': 'Display this help message.' },
  { 'remix.loadgist(id)': 'Load a gist in the file explorer.' },
  // { 'remix.loadurl(url)': 'Load the given url in the file explorer. The url can be of type github, swarm or ipfs.' },

  // { 'swarmgw.get(url, cb)': 'Download files from Swarm via https://swarm-gateways.net/' },
  // { 'swarmgw.put(content, cb)': 'Upload files to Swarm via https://swarm-gateways.net/' },

  { 'ethers.Contract': 'This API provides a graceful connection to a contract deployed on the blockchain, simplifying calling and querying its functions and handling all the binary protocol and conversion as necessarily.' },
  // { 'ethers.HDNode': 'A Hierarchical Deterministic Wallet represents a large tree of private keys which can reliably be reproduced from an initial seed.' },
  // { 'ethers.Interface': 'The Interface Object is a meta-class that accepts a Solidity (or compatible) Application Binary Interface (ABI) and populates functions to deal with encoding and decoding the parameters to pass in and results returned.' },
  { 'ethers.providers': 'A Provider abstracts a connection to the Ethereum blockchain, for issuing queries and sending state changing transactions.' },
  // { 'ethers.SigningKey': 'The SigningKey interface provides an abstraction around the secp256k1 elliptic curve cryptography library.' },
  // { 'ethers.utils': 'The utility functions exposed in both the ethers umbrella package and the ethers-utils.' },
  // { 'ethers.utils.AbiCoder': 'Create a new ABI Coder object' },
  // { 'ethers.utils.RLP': 'This encoding method is used internally for several aspects of Ethereum, such as encoding transactions and determining contract addresses.' },
  { 'ethers.Wallet': 'A wallet manages a private/public key pair which is used to cryptographically sign transactions and prove ownership on the Ethereum network.' },
  { 'ethers.version': 'Contains the version of the ethers container object.' },

  { 'web3.eth': 'Eth module for interacting with the Ethereum network.' },
  { 'web3.eth.accounts': 'The web3.eth.accounts contains functions to generate Ethereum accounts and sign transactions and data.' },
  // TODO: need to break down the object return from abi response
  // { 'web3.eth.abi': 'The web3.eth.abi functions let you de- and encode parameters to ABI (Application Binary Interface) for function calls to the EVM (Ethereum Virtual Machine).' },
  { 'web3.eth.ens': 'The web3.eth.ens functions let you interacting with ENS.' },
  { 'web3.eth.Iban': 'The web3.eth.Iban function lets convert Ethereum addresses from and to IBAN and BBAN.' },
  { 'web3.eth.net': 'Net module for interacting with network properties.' },
  { 'web3.eth.personal': 'Personal module for interacting with the Ethereum accounts.' },
  { 'web3.eth.subscribe': 'The web3.eth.subscribe function lets you subscribe to specific events in the blockchain.' },
  { 'web3.givenProvider': 'When using web3.js in an Ethereum compatible browser, it will set with the current native provider by that browser. Will return the given provider by the (browser) environment, otherwise null.' },
  // { 'web3.modules': 'Contains the version of the web3 container object.' },
  { 'web3.providers': 'Contains the current available providers.' },
  { 'web3.shh': 'Shh module for interacting with the whisper protocol' },
  { 'web3.utils': 'This package provides utility functions for Ethereum dapps and other web3.js packages.' },
  { 'web3.version': 'Contains the version of the web3 container object.' },

  { 'web3.eth.clearSubscriptions();': 'Resets subscriptions.' }
//   { 'web3.eth.Contract(jsonInterface[, address][, options])': 'The web3.eth.Contract object makes it easy to interact with smart contracts on the ethereum blockchain.' },
//   { 'web3.eth.accounts.create([entropy]);': 'The web3.eth.accounts contains functions to generate Ethereum accounts and sign transactions and data.' },
//   { 'web3.eth.getAccounts();': 'Retrieve the list of accounts' },
//   { 'web3.eth.accounts.privateKeyToAccount(privateKey [, ignoreLength ]);': 'Get the account from the private key' },
//   { 'web3.eth.accounts.signTransaction(tx, privateKey [, callback]);': 'Sign Transaction' },
//   { 'web3.eth.accounts.recoverTransaction(rawTransaction);': 'Sign Transaction' },
//   { 'web3.eth.accounts.hashMessage(message);': 'Hash message' }
]
