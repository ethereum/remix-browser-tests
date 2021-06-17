import * as WS from 'ws' // eslint-disable-line
import { PluginClient } from '@remixproject/plugin'
import { existsSync, readFileSync } from 'fs'
const { spawn, execSync } = require('child_process')

export class SlitherClient extends PluginClient {
  methods: Array<string>
  websocket: WS
  currentSharedFolder: string

  constructor (private readOnly = false) {
    super()
    this.methods = ['analyse']
  }

  setWebSocket (websocket: WS): void {
    this.websocket = websocket
  }

  sharedFolder (currentSharedFolder: string): void {
    this.currentSharedFolder = currentSharedFolder
  }

  transform (detectors) {
    // detectors
    // I/O standard mapping
// Analysis Description -> description
// Analysis Short title -> check
// Confidence -> confidence
// Severity -> impact
// Source Map -> elements[i].source_mapping (remove filename_used, filename_absolute)

  }

  analyse (filePath: string, compilerConfig) {
    return new Promise((resolve, reject) => {
      if (this.readOnly) {
        const errMsg = '[Slither Analysis]: Cannot analyse in read-only mode'
        return reject(new Error(errMsg))
      }
      const options = { cwd: this.currentSharedFolder, shell: true }
      const { currentVersion, optimize, evmVersion } = compilerConfig
      if (currentVersion) {
        const versionString = currentVersion.substring(0, currentVersion.indexOf('+commit') + 16)
        const solcOutput = execSync('solc --version', options)
        if (!solcOutput.toString().includes(versionString)) {
          const version = versionString.substring(0, versionString.indexOf('+commit'))
          const solcSelectInstalledVersions = execSync('solc-select versions', options)
          if (!solcSelectInstalledVersions.toString().includes(version)) {
            execSync(`solc-select install ${version}`, options)
          }
          execSync(`solc-select use ${version}`, options)
        }
      }
      const outputFile = 'remix-slitherReport_' + Date.now() + '.json'
      const optimizeOption = optimize ? '--optimize ' : ''
      const evmOption = evmVersion ? `--evm-version ${evmVersion}` : ''
      const solcArgs = optimizeOption || evmOption ? `--solc-args '${optimizeOption}${evmOption}'` : ''
      const cmd = `slither ${filePath} ${solcArgs} --json ${outputFile}`
      const child = spawn(cmd, options)
      let result = ''
      let error = ''
      let response = {}
      child.stdout.on('data', (data) => {
        const msg = `[Slither Analysis]: ${data.toString()}`
        console.log('\x1b[32m%s\x1b[0m', msg)
        result += msg + '\n'
      })
      child.stderr.on('data', (err) => {
        error += `[Slither Analysis]: ${err.toString()}`
      })
      child.on('close', () => {
        const outputFileAbsPath = `${this.currentSharedFolder}/${outputFile}`
        if (existsSync (outputFileAbsPath)) {
          const report = readFileSync(outputFileAbsPath, 'utf8')
          console.log('report--->', report)
          if (report['success']) {
            response['status'] = true
            if (!report['results'] || !report['results'].detectors || !report['results'].detectors.length) {
              response['count'] = 0
            } else {
              const { detectors }  = report['results']
              response['count'] = detectors.length
              response['data'] = this.transform(detectors)
            }
            resolve(response)
          } else {
            console.log('[Slither Analysis]: Error in running Slither Analysis')
            console.log(report['error'])
            reject(new Error('Error in running Slither Analysis. See remixd console.'))
          }
        } else reject(new Error('Error in generating Slither Analysis Report. See remixd console.'))
        // if (error) reject(error)
        // else resolve(result)
      })
    })
  }
}
