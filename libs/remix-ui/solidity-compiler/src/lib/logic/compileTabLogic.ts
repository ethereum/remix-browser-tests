import { Plugin } from '@remixproject/engine'

const packageJson = require('../../../../../../package.json')
const Compiler = require('@remix-project/remix-solidity').Compiler
const EventEmitter = require('events')
const profile = {
  name: 'solidity-logic',
  displayName: 'Solidity compiler logic',
  description: 'Compile solidity contracts - Logic',
  methods: ['getCompilerState'],
  version: packageJson.version
}
export class CompileTab extends Plugin {
  public compiler
  public optimize
  public runs
  public evmVersion: string
  public language: string
  public compilerImport
  public event

  constructor (public api, public contentImport) {
    super(profile)
    this.event = new EventEmitter()
    this.compiler = new Compiler((url, cb) => this.call('contentImport', 'resolveAndSave', url).then((result) => cb(null, result)).catch((error) => cb(error.message)))
  }

  init () {
    this.optimize = this.api.getParameters().optimize
    this.optimize = this.optimize === 'true'
    this.api.setParameters({ optimize: this.optimize })
    this.compiler.set('optimize', this.optimize)

    this.runs = this.api.getParameters().runs
    this.runs = this.runs && this.runs !== 'undefined' ? this.runs : 200
    this.api.setParameters({ runs: this.runs })
    this.compiler.set('runs', this.runs)

    this.evmVersion = this.api.getParameters().evmVersion
    if (this.evmVersion === 'undefined' || this.evmVersion === 'null' || !this.evmVersion) {
      this.evmVersion = null
    }
    this.api.setParameters({ evmVersion: this.evmVersion })
    this.compiler.set('evmVersion', this.evmVersion)

    this.language = this.api.getParameters().language
    if(this.language === 'undefined' || this.language === 'null' || !this.language) {
      this.language = null
    }
    this.api.setParameters({ 'language': this.language })
    this.compiler.set('language', this.language)
  }

  setOptimize (newOptimizeValue) {
    this.optimize = newOptimizeValue
    this.api.setParameters({ optimize: this.optimize })
    this.compiler.set('optimize', this.optimize)
  }

  setRuns (runs) {
    this.runs = runs
    this.api.setParameters({ runs: this.runs })
    this.compiler.set('runs', this.runs)
  }

  setEvmVersion (newEvmVersion) {
    this.evmVersion = newEvmVersion
    this.api.setParameters({ evmVersion: this.evmVersion })
    this.compiler.set('evmVersion', this.evmVersion)
  }

  getCompilerState () {
    return this.compiler.state
  }

  /**
   * Set the compiler to using Solidity or Yul (default to Solidity)
   * @params lang {'Solidity' | 'Yul'} ...
   */
  setLanguage (lang) {
    this.language = lang;
    this.api.setParameters({ language: lang })
    this.compiler.set('language', lang)
  }

  /**
   * Compile a specific file of the file manager
   * @param {string} target the path to the file to compile
   */
  compileFile (target) {
    if (!target) throw new Error('No target provided for compiliation')
    const provider = this.api.fileProviderOf(target)
    if (!provider) throw new Error(`cannot compile ${target}. Does not belong to any explorer`)
    return new Promise((resolve, reject) => {
      provider.get(target, (error, content) => {
        if (error) return reject(error)
        const sources = { [target]: { content } }
        this.event.emit('startingCompilation')
        // setTimeout fix the animation on chrome... (animation triggered by 'staringCompilation')
        setTimeout(() => { this.compiler.compile(sources, target); resolve(true) }, 100)
      })
    })
  }

  async isHardhatProject () {
    if (this.api.getFileManagerMode() === 'localhost') {
      return await this.api.fileExists('hardhat.config.js')
    } else return false
  }

  runCompiler (hhCompilation) {
    try {
      if (this.api.getFileManagerMode() === 'localhost' && hhCompilation) {
        const { currentVersion, optimize, runs } = this.compiler.state
        if (currentVersion) {
          const fileContent = `module.exports = {
            solidity: '${currentVersion.substring(0, currentVersion.indexOf('+commit'))}',
            settings: {
              optimizer: {
                enabled: ${optimize},
                runs: ${runs}
              }
            }
          }
          `
          const configFilePath = 'remix-compiler.config.js'
          this.api.writeFile(configFilePath, fileContent)
          this.call('hardhat', 'compile', configFilePath).then((result) => {
            this.call('terminal', 'log', { type: 'info', value: result })
          }).catch((error) => {
            this.call('terminal', 'log', { type: 'error', value: error })
          })
        }
      }
      this.api.saveCurrentFile()
      this.event.emit('removeAnnotations')
      var currentFile = this.api.getConfiguration('currentFile')
      return this.compileFile(currentFile)
    } catch (err) {
      console.error(err)
    }
  }
}
