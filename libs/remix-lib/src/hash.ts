import { keccak224, keccak384, keccak256 as k256, keccak512 } from 'ethereum-cryptography/keccak'
const createHash = require('create-hash')
import { encode, Input } from 'rlp'
import { toBytes, setLengthLeft, isHexString } from '@ethereumjs/util'

/**
 * Creates Keccak hash of a Uint8Array input
 * @param a The input data (Uint8Array)
 * @param bits (number = 256) The Keccak width
 */
export const keccak = function(a: Uint8Array, bits: number = 256): Uint8Array {
  switch (bits) {
  case 224: {
    return toBytes(keccak224(Buffer.from(a)))
  }
  case 256: {
    return toBytes(k256(Buffer.from(a)))
  }
  case 384: {
    return toBytes(keccak384(Buffer.from(a)))
  }
  case 512: {
    return toBytes(keccak512(Buffer.from(a)))
  }
  default: {
    throw new Error(`Invalid algorithm: keccak${bits}`)
  }
  }
}

/**
 * Creates Keccak-256 hash of the input, alias for keccak(a, 256).
 * @param a The input data (Buffer)
 */
export const keccak256 = function(a: Buffer): Uint8Array {
  return keccak(a)
}

/**
 * Creates Keccak hash of an utf-8 string input
 * @param a The input data (String)
 * @param bits (number = 256) The Keccak width
 */
export const keccakFromString = function(a: string, bits: number = 256) {
  assertIsString(a)
  const buf = Buffer.from(a, 'utf8')
  return keccak(buf, bits)
}

/**
 * Creates Keccak hash of a 0x-prefixed string input
 * @param a The input data (String)
 * @param bits (number = 256) The Keccak width
 */
export const keccakFromHexString = function(a: string, bits: number = 256) {
  assertIsHexString(a)
  return keccak(Buffer.from(toBytes(a)), bits)
}

/**
 * Creates Keccak hash of a number array input
 * @param a The input data (number[])
 * @param bits (number = 256) The Keccak width
 */
export const keccakFromArray = function(a: number[], bits: number = 256) {
  assertIsArray(a)
  return keccak(Buffer.from(toBytes(a)), bits)
}

/**
 * Creates SHA256 hash of an input.
 * @param  a The input data (Buffer|Array|String)
 */
const _sha256 = function(a: any): Buffer {
  a = toBytes(a)
  return createHash('sha256')
    .update(a)
    .digest()
}

/**
 * Creates SHA256 hash of a Buffer input.
 * @param a The input data (Buffer)
 */
export const sha256 = function(a: Buffer): Buffer {
  assertIsBuffer(a)
  return _sha256(a)
}

/**
 * Creates SHA256 hash of a string input.
 * @param a The input data (string)
 */
export const sha256FromString = function(a: string): Buffer {
  assertIsString(a)
  return _sha256(a)
}

/**
 * Creates SHA256 hash of a number[] input.
 * @param a The input data (number[])
 */
export const sha256FromArray = function(a: number[]): Buffer {
  assertIsArray(a)
  return _sha256(a)
}

/**
 * Creates RIPEMD160 hash of the input.
 * @param a The input data (Buffer|Array|String|Number)
 * @param padded Whether it should be padded to 256 bits or not
 */
const _ripemd160 = function(a: any, padded: boolean): Buffer {
  a = toBytes(a)
  const hash = createHash('rmd160')
    .update(a)
    .digest()
  if (padded === true) {
    return Buffer.from(setLengthLeft(hash, 32))
  } else {
    return hash
  }
}

/**
 * Creates RIPEMD160 hash of a Buffer input.
 * @param a The input data (Buffer)
 * @param padded Whether it should be padded to 256 bits or not
 */
export const ripemd160 = function(a: Buffer, padded: boolean): Buffer {
  assertIsBuffer(a)
  return _ripemd160(a, padded)
}

/**
 * Creates RIPEMD160 hash of a string input.
 * @param a The input data (String)
 * @param padded Whether it should be padded to 256 bits or not
 */
export const ripemd160FromString = function(a: string, padded: boolean): Buffer {
  assertIsString(a)
  return _ripemd160(a, padded)
}

/**
 * Creates RIPEMD160 hash of a number[] input.
 * @param a The input data (number[])
 * @param padded Whether it should be padded to 256 bits or not
 */
export const ripemd160FromArray = function(a: number[], padded: boolean): Buffer {
  assertIsArray(a)
  return _ripemd160(a, padded)
}

/**
 * Creates SHA-3 hash of the RLP encoded version of the input.
 * @param a The input data
 */
export const rlphash = function(a: Input): Buffer {
  return Buffer.from(keccak(Buffer.from(encode(a))))
}

/**
 * Throws if a string is not hex prefixed
 * @param {string} input string to check hex prefix of
 */
export const assertIsHexString = function(input: string): void {
  if (!isHexString(input)) {
    const msg = `This method only supports 0x-prefixed hex strings but input was: ${input}`
    throw new Error(msg)
  }
}

/**
 * Throws if input is not a buffer
 * @param {Buffer} input value to check
 */
export const assertIsBuffer = function(input: Buffer): void {
  if (!Buffer.isBuffer(input)) {
    const msg = `This method only supports Buffer but input was: ${input}`
    throw new Error(msg)
  }
}

/**
 * Throws if input is not an array
 * @param {number[]} input value to check
 */
export const assertIsArray = function(input: number[]): void {
  if (!Array.isArray(input)) {
    const msg = `This method only supports number arrays but input was: ${input}`
    throw new Error(msg)
  }
}

/**
 * Throws if input is not a string
 * @param {string} input value to check
 */
export const assertIsString = function(input: string): void {
  if (typeof input !== 'string') {
    const msg = `This method only supports strings but input was: ${input}`
    throw new Error(msg)
  }
}
