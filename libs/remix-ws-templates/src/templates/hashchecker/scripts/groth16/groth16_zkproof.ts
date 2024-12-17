import { poseidon } from "circomlibjs" // v0.0.8

// eslint-disable-next-line @typescript-eslint/no-var-requires
const snarkjs = require('snarkjs');

const logger = {
  info: (...args) => console.log(...args),
  debug: (...args) => console.log(...args),
  error: (...args) => console.error(...args),
};

(async () => {
  try {
    // @ts-ignore
    const r1csBuffer = await remix.call('fileManager', 'readFile', 'circuits/.bin/calculate_hash.r1cs', { encoding: null });
    // @ts-ignore
    const r1cs = new Uint8Array(r1csBuffer);
    // @ts-ignore
    await remix.call('circuit-compiler', 'compile', 'circuits/calculate_hash.circom');
    // @ts-ignore
    const wasmBuffer = await remix.call('fileManager', 'readFile', 'circuits/.bin/calculate_hash_js/calculate_hash.wasm', { encoding: null });
    // @ts-ignore
    const wasm = new Uint8Array(wasmBuffer);

    const zkey_final = {
      type: "mem",
      data: new Uint8Array(JSON.parse(await remix.call('fileManager', 'readFile', 'scripts/groth16/zk/keys/zkey_final.txt')))
    }
    const wtns = { type: "mem" };

    const vKey = JSON.parse(await remix.call('fileManager', 'readFile', 'scripts/groth16/zk/keys/verification_key.json'))

    const value1 = '1234'
    const value2 = '2'
    const value3 = '3'
    const value4 = '4'

    const wrongValue = '5' // put this in the poseidon hash calculation to simulate a non matching hash.

    const signals = {
      value1,
      value2,
      value3,
      value4,
      hash: poseidon([value1, value2, value3, value4])
    }

    console.log('calculate')
    await snarkjs.wtns.calculate(signals, wasm, wtns);

    console.log('check')
    await snarkjs.wtns.check(r1cs, wtns, logger);

    console.log('prove')
    const { proof, publicSignals } = await snarkjs.groth16.prove(zkey_final, wtns);

    const verified = await snarkjs.groth16.verify(vKey, publicSignals, proof, logger);
    console.log('zk proof validity', verified);

    const templates = {
      groth16: await remix.call('fileManager', 'readFile', 'templates/groth16_verifier.sol.ejs')
    }
    const solidityContract = await snarkjs.zKey.exportSolidityVerifier(zkey_final, templates)

    await remix.call('fileManager', 'writeFile', 'scripts/groth16/zk/build/zk_verifier.sol', solidityContract)
    await remix.call('fileManager', 'writeFile', 'scripts/groth16/zk/build/input.json', JSON.stringify({
      _pA: [proof.pi_a[0], proof.pi_a[1]],
      _pB: [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
      _pC: [proof.pi_c[0], proof.pi_c[1]],
      _pubSignals: publicSignals,
    }, null, 2))
  } catch (e) {
    console.error(e.message)
  }
})()
