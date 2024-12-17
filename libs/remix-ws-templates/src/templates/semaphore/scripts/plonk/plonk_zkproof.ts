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
      data: new Uint8Array(await remix.call('fileManager', 'readFile', 'scripts/plonk/zk/keys/zkey_final.txt', { encoding: null }))
    }
    const wtns = { type: "mem" };

    const vKey = JSON.parse(await remix.call('fileManager', 'readFile', 'scripts/plonk/zk/keys/verification_key.json'))

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
    const { proof, publicSignals } = await snarkjs.plonk.prove(zkey_final, wtns);

    const verified = await snarkjs.plonk.verify(vKey, publicSignals, proof, logger);
    console.log('zk proof validity', verified);
    proof1.root.toString() === publicSignals[0] ? console.log('merkle proof valid') : console.log('merkle proof invalid')

    const templates = {
      plonk: await remix.call('fileManager', 'readFile', 'templates/plonk_verifier.sol.ejs')
    }
    const solidityContract = await snarkjs.zKey.exportSolidityVerifier(zkey_final, templates)

    await remix.call('fileManager', 'writeFile', 'scripts/plonk/zk/build/zk_verifier.sol', solidityContract)
    await remix.call('fileManager', 'writeFile', 'scripts/plonk/zk/build/input.json', JSON.stringify({
      _proof: [
        ethers.utils.hexZeroPad(ethers.BigNumber.from(proof.A[0]).toHexString(), 32),
        ethers.utils.hexZeroPad(ethers.BigNumber.from(proof.A[1]).toHexString(), 32),
        ethers.utils.hexZeroPad(ethers.BigNumber.from(proof.B[0]).toHexString(), 32),
        ethers.utils.hexZeroPad(ethers.BigNumber.from(proof.B[1]).toHexString(), 32),
        ethers.utils.hexZeroPad(ethers.BigNumber.from(proof.C[0]).toHexString(), 32),
        ethers.utils.hexZeroPad(ethers.BigNumber.from(proof.C[1]).toHexString(), 32),
        ethers.utils.hexZeroPad(ethers.BigNumber.from(proof.Z[0]).toHexString(), 32),
        ethers.utils.hexZeroPad(ethers.BigNumber.from(proof.Z[1]).toHexString(), 32),
        ethers.utils.hexZeroPad(ethers.BigNumber.from(proof.T1[0]).toHexString(), 32),
        ethers.utils.hexZeroPad(ethers.BigNumber.from(proof.T1[1]).toHexString(), 32),
        ethers.utils.hexZeroPad(ethers.BigNumber.from(proof.T2[0]).toHexString(), 32),
        ethers.utils.hexZeroPad(ethers.BigNumber.from(proof.T2[1]).toHexString(), 32),
        ethers.utils.hexZeroPad(ethers.BigNumber.from(proof.T3[0]).toHexString(), 32),
        ethers.utils.hexZeroPad(ethers.BigNumber.from(proof.T3[1]).toHexString(), 32),
        ethers.utils.hexZeroPad(ethers.BigNumber.from(proof.Wxi[0]).toHexString(), 32),
        ethers.utils.hexZeroPad(ethers.BigNumber.from(proof.Wxi[1]).toHexString(), 32),
        ethers.utils.hexZeroPad(ethers.BigNumber.from(proof.Wxiw[0]).toHexString(), 32),
        ethers.utils.hexZeroPad(ethers.BigNumber.from(proof.Wxiw[1]).toHexString(), 32),
        ethers.utils.hexZeroPad(ethers.BigNumber.from(proof.eval_a).toHexString(), 32),
        ethers.utils.hexZeroPad(ethers.BigNumber.from(proof.eval_b).toHexString(), 32),
        ethers.utils.hexZeroPad(ethers.BigNumber.from(proof.eval_c).toHexString(), 32),
        ethers.utils.hexZeroPad(ethers.BigNumber.from(proof.eval_s1).toHexString(), 32),
        ethers.utils.hexZeroPad(ethers.BigNumber.from(proof.eval_s2).toHexString(), 32),
        ethers.utils.hexZeroPad(ethers.BigNumber.from(proof.eval_zw).toHexString(), 32),
      ],
      _pubSignals: publicSignals
    }, null, 2))

    console.log('proof done.')
  } catch (e) {
    console.error(e.message)
  }
})()
