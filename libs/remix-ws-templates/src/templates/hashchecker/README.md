
## CIRCOM ZKP Hash Checker WORKSPACE

Welcome to the Remix Circom ZKP Hash Checker Workspace.

The workspace comprises two main directories:

### circuits: Contains sample Hash Checker contracts. These can be compiled to generate a witness using 'Circom ZKP Compiler' plugin.

### scripts: Provides a sample script designed for a trusted setup using snarkjs. This script also aids in generating Solidity code, which is essential for on-chain deployment.

### first steps:

#### 1) compile the hash checker circuit using the remix circom compiler. This will generate artifacts.

#### 2) execute the file `run_setup.ts`:

This step generate a verification key that can be used for generating proof, it will also generate a Solidity contract for on-chain verification.

Note that this section should only be used for development purposes as this way of running the setup is heavily centralized (although some pieces of this script can be used to achieve that).

This generates a verification key (`./zk/build/verification_key.json`) and artifacts from the setup (`./zk/build/zk_setup.txt`).

#### 3) execute the file `run_verification.ts`:

This script:

- generate a witness and a proof of execution. The input parameters of `snarkjs.wtns.calculate` are:

	- 4 values, that should remain private. We want to verify that we know a hash that satisfy these 4 values.
	- a hash, this is a public signal.

The witness will be generated only if the provided hash is the poseidon hash of these 4 values.

- verify that the proof is valid `(snarkjs.groth16.verify)`
