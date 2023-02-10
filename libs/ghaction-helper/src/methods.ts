// @ts-ignore
import { ethers } from "ethers"
import { Provider } from '@remix-project/remix-simulator'
import { getArtifactsByContractName } from './artifacts-helper'
import { SignerWithAddress } from './signer'

global.remixProvider = new Provider({ fork: null })

const isFactoryOptions = (signerOrOptions: any) => {
  if (!signerOrOptions || signerOrOptions === undefined || signerOrOptions instanceof ethers.Signer) return false
  return true
}

const isArtifact = (artifact: any) => {
  const {
    contractName,
    sourceName,
    abi,
    bytecode,
    deployedBytecode,
    linkReferences,
    deployedLinkReferences,
  } = artifact

  return (
    typeof contractName === "string" &&
    typeof sourceName === "string" &&
    Array.isArray(abi) &&
    typeof bytecode === "string" &&
    typeof deployedBytecode === "string" &&
    linkReferences !== undefined &&
    deployedLinkReferences !== undefined
  )
}

function linkBytecode(artifact: any, libraries: any) {
  let bytecode = artifact.bytecode

  for (const { sourceName, libraryName, address } of libraries) {
    const linkReferences = artifact.linkReferences[sourceName][libraryName]

    for (const { start, length } of linkReferences) {
      bytecode =
        bytecode.substr(0, 2 + start * 2) +
        address.substr(2) +
        bytecode.substr(2 + (start + length) * 2)
    }
  }

  return bytecode
}

const collectLibrariesAndLink = async (artifact: any, libraries: any) => {
  const neededLibraries = []
  for (const [sourceName, sourceLibraries] of Object.entries(artifact.linkReferences)) {
    // @ts-ignore
    for (const libName of Object.keys(sourceLibraries)) {
      neededLibraries.push({ sourceName, libName })
    }
  }

  const linksToApply = new Map()
  for (const [linkedLibraryName, linkedLibraryAddress] of Object.entries(libraries)) {
    // @ts-ignore
    if (!ethers.utils.isAddress(linkedLibraryAddress)) {
      throw new Error(
        `You tried to link the contract ${artifact.contractName} with the library ${linkedLibraryName}, but provided this invalid address: ${linkedLibraryAddress}`
      )
    }

    const matchingNeededLibraries = neededLibraries.filter((lib) => {
      return (
        lib.libName === linkedLibraryName ||
        `${lib.sourceName}:${lib.libName}` === linkedLibraryName
      )
    })

    if (matchingNeededLibraries.length === 0) {
      let detailedMessage
      if (neededLibraries.length > 0) {
        const libraryFQNames = neededLibraries
          .map((lib) => `${lib.sourceName}:${lib.libName}`)
          .map((x) => `* ${x}`)
          .join("\n")
        detailedMessage = `The libraries needed are:
      ${libraryFQNames}`
      } else {
        detailedMessage = "This contract doesn't need linking any libraries."
      }
      throw new Error(
        `You tried to link the contract ${artifact.contractName} with ${linkedLibraryName}, which is not one of its libraries.
      ${detailedMessage}`
      )
    }

    if (matchingNeededLibraries.length > 1) {
      const matchingNeededLibrariesFQNs = matchingNeededLibraries
        .map(({ sourceName, libName }) => `${sourceName}:${libName}`)
        .map((x) => `* ${x}`)
        .join("\n")
      throw new Error(
        `The library name ${linkedLibraryName} is ambiguous for the contract ${artifact.contractName}.
        It may resolve to one of the following libraries:
        ${matchingNeededLibrariesFQNs}
        To fix this, choose one of these fully qualified library names and replace where appropriate.`
      )
    }

    const [neededLibrary] = matchingNeededLibraries

    const neededLibraryFQN = `${neededLibrary.sourceName}:${neededLibrary.libName}`

    // The only way for this library to be already mapped is
    // for it to be given twice in the libraries user input:
    // once as a library name and another as a fully qualified library name.
    if (linksToApply.has(neededLibraryFQN)) {
      throw new Error(
        `The library names ${neededLibrary.libName} and ${neededLibraryFQN} refer to the same library and were given as two separate library links.
        Remove one of them and review your library links before proceeding.`
      )
    }

    linksToApply.set(neededLibraryFQN, {
      sourceName: neededLibrary.sourceName,
      libraryName: neededLibrary.libName,
      address: linkedLibraryAddress,
    })
  }

  if (linksToApply.size < neededLibraries.length) {
    const missingLibraries = neededLibraries
      .map((lib) => `${lib.sourceName}:${lib.libName}`)
      .filter((libFQName) => !linksToApply.has(libFQName))
      .map((x) => `* ${x}`)
      .join("\n")

    throw new Error(
      `The contract ${artifact.contractName} is missing links for the following libraries:
      ${missingLibraries}`
    )
  }

  // @ts-ignore
  return linkBytecode(artifact, [...linksToApply.values()])
}

// Convert output.contracts.<filename>.<contractName> in Artifact object compatible form
const resultToArtifact = (result: any) => {
  const { fullyQualifiedName, artefact } = result
  return {
    contractName: fullyQualifiedName.split(':')[1],
    sourceName: fullyQualifiedName.split(':')[0],
    abi: artefact.abi,
    bytecode: artefact.evm.bytecode.object,
    deployedBytecode: artefact.evm.deployedBytecode.object,
    linkReferences: artefact.evm.bytecode.linkReferences,
    deployedLinkReferences: artefact.evm.deployedBytecode.linkReferences
  }
}

const getContractFactory = async (contractNameOrABI: ethers.ContractInterface, bytecode?: string, signerOrOptions = null) => {
  //@ts-ignore
  if (!global.remixProvider.Transactions.txRunnerInstance) await remixProvider.init()
  if (bytecode && contractNameOrABI) {
    //@ts-ignore
    return new ethers.ContractFactory(contractNameOrABI, bytecode, signerOrOptions || (new ethers.providers.Web3Provider(remixProvider)).getSigner())
  } else if (typeof contractNameOrABI === 'string') {
    const contract = await getArtifactsByContractName(contractNameOrABI)

    if (contract) {
      //@ts-ignore
      return new ethers.ContractFactory(contract.abi, contract.evm.bytecode.object, signerOrOptions || (new ethers.providers.Web3Provider(remixProvider)).getSigner())
    } else {
      throw new Error('Contract artifacts not found')
    }
  } else {
    throw new Error('Invalid contract name or ABI provided')
  }
}

const getContractAt = async (contractNameOrABI: ethers.ContractInterface, address: string, signer = null) => {
  //@ts-ignore
  if (!global.remixProvider.Transactions.txRunnerInstance) await remixProvider.init()
  //@ts-ignore
  const provider = new ethers.providers.Web3Provider(remixProvider)

  if(typeof contractNameOrABI === 'string') {
    const result = await getArtifactsByContractName(contractNameOrABI)
    
    if (result) {
      return new ethers.Contract(address, result.abi, signer || provider.getSigner())
    } else {
            throw new Error('Contract artifacts not found')
    }
  } else {
    return new ethers.Contract(address, contractNameOrABI, signer || provider.getSigner())
  }
}

const getSigner = async (address: string) => {
  //@ts-ignore
  if (!global.remixProvider.Transactions.txRunnerInstance) await remixProvider.init()
  //@ts-ignore
  const provider = new ethers.providers.Web3Provider(remixProvider)
  const signer = provider.getSigner(address)

  return SignerWithAddress.create(signer)
}

const getSigners = async () => {
  //@ts-ignore
  if (!global.remixProvider.Transactions.txRunnerInstance) await remixProvider.init()
  //@ts-ignore
  const provider = new ethers.providers.Web3Provider(remixProvider)
  const accounts = await provider.listAccounts()

  return await Promise.all( accounts.map((account: any) => getSigner(account)))
}

const getContractFactoryFromArtifact = async (artifact: any, signerOrOptions: { signer: any, libraries: any }) => {
  //@ts-ignore
  if (!global.remixProvider.Transactions.txRunnerInstance) await remixProvider.init()
  let libraries = {}
  let signer

  if (!isArtifact(artifact)) {
    throw new Error(
      `You are trying to create a contract factory from an artifact, but you have not passed a valid artifact parameter.`
    )
  }

  if (isFactoryOptions(signerOrOptions)) {
    signer = signerOrOptions.signer;
    libraries = signerOrOptions.libraries ?? {};
  } else {
    signer = signerOrOptions;
  }

  if (artifact.bytecode === "0x") {
    throw new Error(
      `You are trying to create a contract factory for the contract ${artifact.contractName}, which is abstract and can't be deployed.
If you want to call a contract using ${artifact.contractName} as its interface use the "getContractAt" function instead.`
    )
  }

  const linkedBytecode = await collectLibrariesAndLink(artifact, libraries)
  //@ts-ignore
  return new ethers.ContractFactory(artifact.abi, linkedBytecode || artifact.bytecode, signer || (new ethers.providers.Web3Provider(remixProvider)).getSigner())
}

const getContractAtFromArtifact = async (artifact: any, address: string, signerOrOptions = null) => {
  if (!isArtifact(artifact)) {
    throw new Error(
      `You are trying to create a contract factory from an artifact, but you have not passed a valid artifact parameter.`
    )
  }

  return await getContractAt(artifact.abi, address, signerOrOptions)
}

export { getContractAtFromArtifact, getContractFactoryFromArtifact, getSigners, getSigner, getContractAt, getContractFactory }
