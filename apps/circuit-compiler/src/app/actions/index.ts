import * as snarkjs from 'snarkjs'
import type { CircomPluginClient } from '../services/circomPluginClient'
import { ActionPayloadTypes, AppState, ICircuitAppContext } from '../types'
import { GROTH16_VERIFIER, PLONK_VERIFIER } from './constant'
import { extractNameFromKey, extractParentFromKey } from '@remix-ui/helper'
import isElectron from 'is-electron'

export const compileCircuit = async (plugin: CircomPluginClient, appState: AppState) => {
  if (appState.status !== 'compiling') {
    return console.log('Existing circuit compilation in progress')
  }

  try {
    await plugin.compile(appState.filePath, { version: appState.version, prime: appState.primeValue })
  } catch (e) {
    handleError(plugin, 'circuit_compiling_errored', e)
  }
}

export const computeWitness = async (plugin: CircomPluginClient, appState: AppState, dispatch: ICircuitAppContext['dispatch'], status: string, witnessValues: Record<string, string>) => {
  if (status !== 'computing') {
    return console.log('Existing witness computation in progress')
  }

  try {
    const input = JSON.stringify(witnessValues)
    const witness = await plugin.computeWitness(input)

    if (appState.exportWtnsJson) {
      const wtns = await snarkjs.wtns.exportJson(witness)
      const wtnsJson = wtns.map((wtn) => wtn.toString())
      const fileName = extractNameFromKey(appState.filePath)
      const writePath = extractParentFromKey(appState.filePath) + `/.bin/${fileName.replace('.circom', '_js')}/${fileName.replace('.circom', '.wtn.json')}`

      await writeFile(plugin, writePath, JSON.stringify(wtnsJson, null, 2))
      trackEvent(plugin, 'computeWitness', 'wtns.exportJson', writePath)
    }
  } catch (e) {
    handleError(plugin, 'circuit_computing_witness_errored', e)
  }
}

export const runSetupAndExport = async (plugin: CircomPluginClient, appState: AppState, dispatch: ICircuitAppContext['dispatch']) => {
  try {
    dispatch({ type: 'SET_COMPILER_STATUS', payload: 'exporting' })
    dispatch({ type: 'SET_SETUP_EXPORT_FEEDBACK', payload: null })
    plugin.emit('statusChanged', { key: 'none' })

    const ptauFinal = getPtauUrl(appState)
    await plugin.generateR1cs(appState.filePath, { version: appState.version, prime: appState.primeValue })

    const r1cs = await readFileAsUint8Array(plugin, getR1csPath(appState))
    const zkeyFinal = { type: 'mem' }

    if (appState.provingScheme === 'groth16') {
      await setupGroth16(plugin, appState, dispatch, r1cs, ptauFinal, zkeyFinal)
    } else if (appState.provingScheme === 'plonk') {
      await setupPlonk(plugin, appState, dispatch, r1cs, ptauFinal, zkeyFinal)
    }

    dispatch({ type: 'SET_COMPILER_STATUS', payload: 'idle' })
    dispatch({ type: 'SET_SETUP_EXPORT_STATUS', payload: 'done' })
  } catch (e) {
    trackEvent(plugin, 'runSetupAndExport', 'error', e.message)
    dispatch({ type: 'SET_COMPILER_STATUS', payload: 'errored' })
    console.error(e)
  }
}

export const generateProof = async (plugin: CircomPluginClient, appState: AppState, dispatch: ICircuitAppContext['dispatch']) => {
  try {
    dispatch({ type: 'SET_COMPILER_STATUS', payload: 'proving' })
    dispatch({ type: 'SET_PROOF_FEEDBACK', payload: null })
    plugin.emit('statusChanged', { key: 'none' })

    const r1cs = await readFileAsUint8Array(plugin, getR1csPath(appState))
    const wtns = await readFileAsUint8Array(plugin, getWitnessPath(appState))

    await snarkjs.wtns.check(r1cs, wtns, zkLogger(plugin, dispatch, 'SET_PROOF_FEEDBACK'))

    const proofMethod = appState.provingScheme === 'groth16' ? proveGroth16 : provePlonk
    await proofMethod(plugin, appState, dispatch, wtns)

    dispatch({ type: 'SET_COMPILER_STATUS', payload: 'idle' })
    dispatch({ type: 'SET_PROOF_FEEDBACK', payload: null })
  } catch (e) {
    dispatch({ type: 'SET_COMPILER_STATUS', payload: 'errored' })
    dispatch({ type: 'SET_PROOF_FEEDBACK', payload: e.message })
    console.error(e)
  }
}

// Helper Functions

function getR1csPath(appState: AppState) {
  const fileName = extractNameFromKey(appState.filePath)
  return `${extractParentFromKey(appState.filePath)}/.bin/${fileName.replace('.circom', '.r1cs')}`
}

function getWitnessPath(appState: AppState) {
  return getR1csPath(appState).replace('.r1cs', '.wtn')
}

function getPtauUrl(appState: AppState) {
  return `https://ipfs-cluster.ethdevops.io/ipfs/${appState.ptauList.find((ptau) => ptau.name === appState.ptauValue)?.ipfsHash}`
}

async function setupGroth16(plugin: CircomPluginClient, appState: AppState, dispatch, r1cs, ptauFinal, zkeyFinal) {
  await snarkjs.zKey.newZKey(r1cs, ptauFinal, zkeyFinal, zkLogger(plugin, dispatch, 'SET_SETUP_EXPORT_FEEDBACK'))
  const vKey = await snarkjs.zKey.exportVerificationKey(zkeyFinal)

  await exportVerificationFiles(plugin, appState, vKey, GROTH16_VERIFIER, zkeyFinal, 'groth16')
  dispatch({ type: 'SET_ZKEY', payload: zkeyFinal })
  dispatch({ type: 'SET_VERIFICATION_KEY', payload: vKey })
}

async function setupPlonk(plugin: CircomPluginClient, appState: AppState, dispatch, r1cs, ptauFinal, zkeyFinal) {
  await snarkjs.plonk.setup(r1cs, ptauFinal, zkeyFinal, zkLogger(plugin, dispatch, 'SET_SETUP_EXPORT_FEEDBACK'))
  const vKey = await snarkjs.zKey.exportVerificationKey(zkeyFinal)

  await exportVerificationFiles(plugin, appState, vKey, PLONK_VERIFIER, zkeyFinal, 'plonk')
  dispatch({ type: 'SET_ZKEY', payload: zkeyFinal })
  dispatch({ type: 'SET_VERIFICATION_KEY', payload: vKey })
}

async function proveGroth16(plugin: CircomPluginClient, appState: AppState, dispatch, wtns) {
  const { proof, publicSignals } = await snarkjs.groth16.prove(appState.zKey, wtns, zkLogger(plugin, dispatch, 'SET_PROOF_FEEDBACK'))
  const verified = await snarkjs.groth16.verify(appState.verificationKey, publicSignals, proof)

  await writeProofFiles(plugin, appState, proof, 'groth16', verified)
}

async function provePlonk(plugin: CircomPluginClient, appState: AppState, dispatch, wtns) {
  const { proof, publicSignals } = await snarkjs.plonk.prove(appState.zKey, wtns, zkLogger(plugin, dispatch, 'SET_PROOF_FEEDBACK'))
  const verified = await snarkjs.plonk.verify(appState.verificationKey, publicSignals, proof)

  await writeProofFiles(plugin, appState, proof, 'plonk', verified)
}

async function exportVerificationFiles(plugin, appState, vKey, verifierTemplate, zkeyFinal, scheme) {
  if (appState.exportVerificationKey) {
    await writeFile(plugin, `${extractParentFromKey(appState.filePath)}/${scheme}/zk/keys/verification_key.json`, JSON.stringify(vKey, null, 2))
  }

  if (appState.exportVerificationContract) {
    const solidityContract = await snarkjs.zKey.exportSolidityVerifier(zkeyFinal, verifierTemplate)
    await writeFile(plugin, `${extractParentFromKey(appState.filePath)}/${scheme}/zk/verifier.sol`, solidityContract)
  }
}

async function writeProofFiles(plugin, appState, proof, scheme, verified) {
  const proofPath = `${extractParentFromKey(appState.filePath)}/${scheme}/zk/proof.json`
  await writeFile(plugin, proofPath, JSON.stringify(proof, null, 2))

  if (verified) {
    trackEvent(plugin, 'proof_verified', proofPath, 'notification')
  } else {
    trackEvent(plugin, 'proof_failed', proofPath, 'notification')
  }
}

function trackEvent(plugin, eventCategory, action, label) {
  plugin._paq.push(['trackEvent', eventCategory, action, label])
}

async function readFileAsUint8Array(plugin: CircomPluginClient, path: string) {
  // @ts-ignore
  await plugin.call('fileManager', 'readFile', path)
}

async function writeFile(plugin: CircomPluginClient, path: string, content: string) {
  // @ts-ignore
  await plugin.call('fileManager', 'writeFile', path, content)
}

function handleError(plugin: CircomPluginClient, event: string, error: Error) {
  console.error(error)
  trackEvent(plugin, 'error', event, error.message)
}

function zkLogger(plugin: CircomPluginClient, dispatch, feedbackType) {
  return (msg: string) => {
    dispatch({ type: feedbackType, payload: msg })
    plugin.emit('statusChanged', { key: 'none' })
  }
}
