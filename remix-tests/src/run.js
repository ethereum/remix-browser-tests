const commander = require('commander')
const Web3 = require('web3')
const RemixTests = require('./index.js')
const fs = require('fs')
const Provider = require('remix-simulator').Provider
const { Log } = require('./logger.js')
const logger = new Log()
const log = logger.logger
require('colors')

// parse verbosity
function mapVerbosity (v) {
  const levels = {
    0: 'error',
    1: 'warn',
    2: 'info',
    3: 'verbose',
    4: 'debug',
    5: 'silly'
  }
  return levels[v]
}
// get current version
const pjson = require('../package.json')
commander
  .version(pjson.version)
  .option('-v, --verbose <level>', 'run with verbosity', mapVerbosity)
  .action(function (filename) {
    // Console message
    console.log(('\n\t👁 :: Running remix-tests - Unit testing for solidity :: 👁\t\n').white)
    // set logger verbosity
    if (commander.verbose) {
      logger.setVerbosity(commander.verbose)
      log.info('verbosity level set to ' + commander.verbose.blue)
    }
    let web3 = new Web3()
    // web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'))
    web3.setProvider(new Provider())
    // web3.setProvider(new web3.providers.WebsocketProvider('ws://localhost:8546'))

    let isDirectory = fs.lstatSync(filename).isDirectory()
    RemixTests.runTestFiles(filename, isDirectory, web3)
  })

if (!process.argv.slice(2).length) {
  log.error('Please specify a filename')
  process.exit()
}

commander.parse(process.argv)
