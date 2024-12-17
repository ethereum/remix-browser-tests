import { ethers, BigNumber } from 'ethers'
import { IncrementalMerkleTree } from "@zk-kit/incremental-merkle-tree"
import { poseidon } from "circomlibjs" // v0.0.8

// eslint-disable-next-line @typescript-eslint/no-var-requires
const snarkjs = require('snarkjs');

const logger = {
  info: (...args) => console.log(...args),
  debug: (...args) => console.log(...args),
  error: (...args) => console.error(...args),
}

/**
 * Creates a keccak256 hash of a message compatible with the SNARK scalar modulus.
 * @param message The message to be hashed.
 * @returns The message digest.
 */
function hash(message: any): bigint {
  message = BigNumber.from(message).toTwos(256).toHexString()
  message = ethers.utils.zeroPad(message, 32)
  return BigInt(ethers.utils.keccak256(message)) >> BigInt(8)
}

(async () => {
  try {
    // @ts-ignore
    const r1csBuffer = await remix.call('fileManager', 'readFile', 'circuits/.bin/semaphore.r1cs', { encoding: null });
    // @ts-ignore
    const r1cs = new Uint8Array(r1csBuffer);
    // @ts-ignore
    await remix.call('circuit-compiler', 'compile', 'circuits/semaphore.circom');
    // @ts-ignore
    const wasmBuffer = await remix.call('fileManager', 'readFile', 'circuits/.bin/semaphore_js/semaphore.wasm', { encoding: null });
    // @ts-ignore
    const wasm = new Uint8Array(wasmBuffer);

    const zkey_final = {
      type: "mem",
      // @ts-ignore
      data: new Uint8Array(await remix.call('fileManager', 'readFile', 'scripts/groth16/zk/keys/zkey_final.txt', { encoding: null }))
    }
    const wtns = { type: "mem" };

    const vKey = JSON.parse(await remix.call('fileManager', 'readFile', 'scripts/groth16/zk/keys/verification_key.json'))

    // build list of identity commitments
    const secrets = []
    const identityCommitments = []
    for (let k = 0; k < 2; k++) {
      const identityTrapdoor = BigInt(ethers.utils.hexlify(ethers.utils.randomBytes(32)))
      const identityNullifier = BigInt(ethers.utils.hexlify(ethers.utils.randomBytes(32)))
      secrets.push({ identityTrapdoor, identityNullifier })

      const secret = poseidon([identityNullifier, identityTrapdoor])
      const identityCommitment = poseidon([secret])
      identityCommitments.push(identityCommitment)
    }
    //console.log('incremental tree', identityCommitments.map((x) => x.toString()))

    let tree

    try {
      tree = new IncrementalMerkleTree(poseidon, 20, BigInt(0), 2, identityCommitments) // Binary tree.
    } catch (e) {
      console.error(e.message)
      return
    }
    const index = tree.indexOf(identityCommitments[0])

    console.log(index.toString())

    const proof1 = tree.createProof(0)

    console.log('prepare signals for id ', identityCommitments[0].toString(), tree.indexOf(identityCommitments[0]), proof1.siblings.map((x)=> x.toString()))

    const signals = {
      identityTrapdoor: secrets[0].identityTrapdoor,
      identityNullifier: secrets[0].identityNullifier,
      treePathIndices: proof1.pathIndices,
      treeSiblings: proof1.siblings,
      externalNullifier: hash(42),
      signalHash: hash(ethers.utils.formatBytes32String("Hello World"))
    }

    console.log('calculate')
    await snarkjs.wtns.calculate(signals, wasm, wtns);

    console.log('check')
    await snarkjs.wtns.check(r1cs, wtns, logger);

    console.log('prove')
    const { proof, publicSignals } = await snarkjs.groth16.prove(zkey_final, wtns);

    const verified = await snarkjs.groth16.verify(vKey, publicSignals, proof, logger);
    console.log('zk proof validity', verified);
    proof1.root.toString() === publicSignals[0] ? console.log('merkle proof valid') : console.log('merkle proof invalid')

    const templates = {
      groth16: await remix.call('fileManager', 'readFile', 'templates/groth16_verifier.sol.ejs')
    }
    const solidityContract = await snarkjs.zKey.exportSolidityVerifier(zkey_final, templates)

    await remix.call('fileManager', 'writeFile', 'scripts/groth16/zk/build/zk_verifier.sol', solidityContract)
    await remix.call('fileManager', 'writeFile', 'scripts/groth16/zk/build/input.json', JSON.stringify({
      _pA: [proof.pi_a[0], proof.pi_a[1]],
      _pB: [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
      _pC: [proof.pi_c[0], proof.pi_c[1]],
      _pubSignals: publicSignals
    }, null, 2))
  } catch (e) {
    console.error(e.message)
  }
})()