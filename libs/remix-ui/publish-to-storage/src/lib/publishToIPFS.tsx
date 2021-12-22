import IpfsClient from 'ipfs-http-client'
import axios from 'axios'
import { ethers } from 'ethers'

export const publishToIPFS = async (contract, api) => {
  // 1. Create web3 authed header
  const pair = ethers.Wallet.createRandom()
  const sig = await pair.signMessage(pair.address)
  const authHeaderRaw = `eth-${pair.address}:${sig}`
  const authHeader = Buffer.from(authHeaderRaw).toString('base64')

  // 2. Init IPFS endpoint
  const ipfsNodes = [
    new IpfsClient({
      url: 'https://crustipfs.xyz/api/v0',
      headers: {
        authorization: 'Basic ' + authHeader
      }
    }), // IPFS Web3 Authed Gateway
    new IpfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' }),
    new IpfsClient({ host: '127.0.0.1', port: 5001, protocol: 'http' })
  ]

  // 3. Gather list of files to publish
  const sources = []
  let metadata
  const item = { content: null, hash: null }
  const uploaded = []

  try {
    metadata = JSON.parse(contract.metadata)
  } catch (e) {
    throw new Error(e)
  }

  if (metadata === undefined) {
    throw new Error('No metadata')
  }

  await Promise.all(Object.keys(metadata.sources).map(fileName => {
    // find hash
    let hash = null
    try {
      // we try extract the hash defined in the metadata.json
      // in order to check if the hash that we get after publishing is the same as the one located in metadata.json
      // if it's not the same, we throw "hash mismatch between solidity bytecode and uploaded content"
      // if we don't find the hash in the metadata.json, the check is not done.
      //
      // TODO: refactor this with publishOnSwarm
      if (metadata.sources[fileName].urls) {
        metadata.sources[fileName].urls.forEach(url => {
          if (url.includes('ipfs')) hash = url.match('dweb:/ipfs/(.+)')[1]
        })
      }
    } catch (e) {
      throw new Error('Error while extracting the hash from metadata.json')
    }

    api.readFile(fileName).then((content) => {
      sources.push({
        content: content,
        hash: hash,
        filename: fileName
      })
    }).catch((error) => {
      console.log(error)
    })
  }))

  // 4. Publish the list of sources in order, fail if any failed
  await Promise.all(sources.map(async (item) => {
    try {
      const result = await ipfsVerifiedPublish(ipfsNodes, item.content, item.hash)
      try {
        item.hash = result.url.match('dweb:/ipfs/(.+)')[1]
        await pinToCrust(authHeader, item.hash)
      } catch (e) {
        item.hash = '<Metadata inconsistency> - ' + item.fileName
      }
      item.output = result
      uploaded.push(item)
    } catch (error) {
      throw new Error(error)
    }
  }))
  const metadataContent = JSON.stringify(metadata)

  try {
    const result = await ipfsVerifiedPublish(ipfsNodes, metadataContent, '')
    try {
      contract.metadataHash = result.url.match('dweb:/ipfs/(.+)')[1]
      await pinToCrust(authHeader, contract.metadataHash)
    } catch (e) {
      contract.metadataHash = '<Metadata inconsistency> - metadata.json'
    }
    item.content = metadataContent
    item.hash = contract.metadataHash
    uploaded.push({
      content: contract.metadata,
      hash: contract.metadataHash,
      filename: 'metadata.json',
      output: result
    })
  } catch (error) {
    throw new Error(error)
  }

  return { uploaded, item }
}

const ipfsVerifiedPublish = async (ipfsNodes, content, expectedHash) => {
  try {
    const results: any = await severalGatewaysPush(ipfsNodes, content)
    const cidResult = results.cid.toV0().toString()
    if (expectedHash && cidResult !== expectedHash) {
      return { message: 'hash mismatch between solidity bytecode and uploaded content.', url: 'dweb:/ipfs/' + cidResult, hash: cidResult }
    } else {
      return { message: 'ok', url: 'dweb:/ipfs/' + cidResult, hash: cidResult }
    }
  } catch (error) {
    throw new Error(error)
  }
}

const severalGatewaysPush = (ipfsNodes, content) => {
  const invert = p => new Promise((resolve, reject) => p.then(reject).catch(resolve)) // Invert res and rej
  const promises = ipfsNodes.map((node) => invert(node.add(content)))

  return invert(Promise.all(promises))
}

const pinToCrust = async (authHeader, cid) => {
  const rst = await axios.post(
    'https://pin.crustcode.com/psa/pins',
    { cid: cid },
    {
      headers: {
        authorization: 'Bearer ' + authHeader
      }
    })

  console.log(rst)
}
