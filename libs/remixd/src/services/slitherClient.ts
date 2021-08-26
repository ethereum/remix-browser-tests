/* eslint dot-notation: "off" */

import * as WS from 'ws' // eslint-disable-line
import { PluginClient } from '@remixproject/plugin'
import { existsSync, readFileSync, readdirSync, unlink } from 'fs'
import { OutputStandard } from '../types' // eslint-disable-line
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

  mapNpmDepsDir (list) {
    const remixNpmDepsPath = `${this.currentSharedFolder}/.deps/npm`
    const localNpmDepsPath = `${this.currentSharedFolder}/node_modules`
    const npmDepsExists = existsSync(remixNpmDepsPath)
    const nodeModulesExists = existsSync(localNpmDepsPath)
    let isLocalDep = false
    let isRemixDep = false
    let allowPathString = ''
    let remapString = ''

    for (const e of list) {
      const importPath = e.replace(/import ['"]/g, '').trim()
      const packageName = importPath.split('/')[0]
      if (nodeModulesExists && readdirSync(localNpmDepsPath).includes(packageName)) {
        isLocalDep = true
        remapString += `${packageName}=./node_modules/${packageName} `
      } else if (npmDepsExists && readdirSync(remixNpmDepsPath).includes(packageName)) {
        isRemixDep = true
        remapString += `${packageName}=./.deps/npm/${packageName} `
      }
    }
    if (isLocalDep) allowPathString += './node_modules,'
    if (isRemixDep) allowPathString += './.deps/npm,'

    return { remapString, allowPathString }
  }

  transform (detectors: Record<string, any>[]): OutputStandard[] {
    const standardReport: OutputStandard[] = []
    for (const e of detectors) {
      const obj = {} as OutputStandard
      obj.description = e.description
      obj.title = e.check
      obj.confidence = e.confidence
      obj.severity = e.impact
      obj.sourceMap = e.elements.map((element) => {
        delete element.source_mapping.filename_used
        delete element.source_mapping.filename_absolute
        return element
      })
      standardReport.push(obj)
    }
    return standardReport
  }

  analyse (filePath: string, compilerConfig: Record<string, any>) {
    return new Promise((resolve, reject) => {
      if (this.readOnly) {
        const errMsg: string = '[Slither Analysis]: Cannot analyse in read-only mode'
        return reject(new Error(errMsg))
      }
      const options = { cwd: this.currentSharedFolder, shell: true }
      const { currentVersion, optimize, evmVersion } = compilerConfig
      if (currentVersion && currentVersion.includes('+commit')) {
        // Get compiler version with commit id e.g: 0.8.2+commit.661d110
        const versionString: string = currentVersion.substring(0, currentVersion.indexOf('+commit') + 16)
        console.log('\x1b[32m%s\x1b[0m', `[Slither Analysis]: Compiler version is ${versionString}`)
        let solcOutput: Buffer
        // Check solc current installed version
        try {
          solcOutput = execSync('solc --version', options)
        } catch (err) {
          console.log(err)
          reject(new Error('Error in running solc command'))
        }
        if (!solcOutput.toString().includes(versionString)) {
          console.log('\x1b[32m%s\x1b[0m', '[Slither Analysis]: Compiler version is different from installed solc version')
          // Get compiler version without commit id e.g: 0.8.2
          const version: string = versionString.substring(0, versionString.indexOf('+commit'))
          // List solc versions installed using solc-select
          try {
            const solcSelectInstalledVersions: Buffer = execSync('solc-select versions', options)
            // Check if required version is already installed
            if (!solcSelectInstalledVersions.toString().includes(version)) {
              console.log('\x1b[32m%s\x1b[0m', `[Slither Analysis]: Installing ${version} using solc-select`)
              // Install required version
              execSync(`solc-select install ${version}`, options)
            }
            console.log('\x1b[32m%s\x1b[0m', `[Slither Analysis]: Setting ${version} as current solc version using solc-select`)
            // Set solc current version as required version
            execSync(`solc-select use ${version}`, options)
          } catch (err) {
            console.log(err)
            reject(new Error('Error in running solc-select command'))
          }
        } else console.log('\x1b[32m%s\x1b[0m', '[Slither Analysis]: Compiler version is same as installed solc version')
      }
      // Allow paths and set solc remapping for import URLs
      const fileContent = readFileSync(`${this.currentSharedFolder}/${filePath}`, 'utf8')
      const importsArr = fileContent.match(/import ['"][^.|..](.+?)['"];/g)
      let remaps = ''
      if (importsArr?.length) {
        const { remapString } = this.mapNpmDepsDir(importsArr)
        remaps = remapString.trim()
      }
      const optimizeOption: string = optimize ? '--optimize' : ''
      const evmOption: string = evmVersion ? `--evm-version ${evmVersion}` : ''
      let solcArgs = ''
      if (optimizeOption) {
        solcArgs += optimizeOption + ' '
      }
      if (evmOption) {
        if (!solcArgs.endsWith(' ')) solcArgs += ' '
        solcArgs += evmOption
      }
      if (solcArgs) {
        solcArgs = `--solc-args "${solcArgs.trimStart()}"`
      }
      const solcRemaps = remaps ? `--solc-remaps "${remaps}"` : ''

      const outputFile: string = 'remix-slitherReport_' + Math.floor(Date.now() / 1000) + '.json'
      const cmd: string = `slither ${filePath} ${solcArgs} ${solcRemaps} --json ${outputFile}`
      console.log('\x1b[32m%s\x1b[0m', '[Slither Analysis]: Running Slither...')
      // Added `stdio: 'ignore'` as for contract with NPM imports analysis which is exported in 'stderr'
      // get too big and hangs the process. We process analysis from the report file only
      const child = spawn(cmd, { cwd: this.currentSharedFolder, shell: true, stdio: 'ignore' })

      const response = {}
      child.on('close', () => {
        const outputFileAbsPath: string = `${this.currentSharedFolder}/${outputFile}`
        // Check if slither report file exists
        if (existsSync(outputFileAbsPath)) {
          let report = readFileSync(outputFileAbsPath, 'utf8')
          report = JSON.parse(report)
          unlink(outputFileAbsPath, (err) => {
            if (err) console.log(err)
          })
          if (report['success']) {
            response['status'] = true
            if (!report['results'] || !report['results'].detectors || !report['results'].detectors.length) {
              response['count'] = 0
            } else {
              const { detectors } = report['results']
              response['count'] = detectors.length
              response['data'] = this.transform(detectors)
            }
            console.log('\x1b[32m%s\x1b[0m', `[Slither Analysis]: Analysis Completed!! ${response['count']} warnings found.`)
            resolve(response)
          } else {
            console.log(report['error'])
            reject(new Error('Error in running Slither Analysis.'))
          }
        } else reject(new Error('Error in generating Slither Analysis Report. Make sure Slither is properly installed.'))
      })
    })
  }
}
