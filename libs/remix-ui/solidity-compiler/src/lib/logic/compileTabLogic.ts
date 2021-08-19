const packageJson = require('../../../../../../package.json')
const Compiler = require('@remix-project/remix-solidity').Compiler
const EventEmitter = require('events')

export class CompileTab {
  public compiler
  public optimize
  public runs
  public evmVersion: string
  public compilerImport
  public event

  constructor (public api, public contentImport) {
    this.event = new EventEmitter()
    this.compiler = new Compiler((url, cb) => api.resolveContentAndSave(url).then((result) => cb(null, result)).catch((error) => cb(error.message)))
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
    this.compiler.set('language', lang)
  }

  /**
   * Compile a specific file of the file manager
   * @param {string} target the path to the file to compile
   */
  compileFile (target) {
    if (!target) throw new Error('No target provided for compiliation')
    return new Promise((resolve, reject) => {
      this.api.readFile(target).then((content) => {
        const sources = { [target]: { content } }
        this.event.emit('startingCompilation')
        // setTimeout fix the animation on chrome... (animation triggered by 'staringCompilation')
        setTimeout(() => { this.compiler.compile(sources, target); resolve(true) }, 100)
      }).catch((error) => {
        reject(error)
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
          this.api.compileWithHardhat(configFilePath).then((result) => {
            this.api.logToTerminal({ type: 'info', value: result })
          }).catch((error) => {
            this.api.logToTerminal({ type: 'error', value: error })
          })
        }
      }
      // TODO readd saving current file
      // this.api.saveCurrentFile()
      this.event.emit('removeAnnotations')
      var currentFile = this.api.getConfiguration('currentFile')
      return this.compileFile(currentFile)
    } catch (err) {
      console.error(err)
    }
  }
}
