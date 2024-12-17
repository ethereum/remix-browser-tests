import { ElectronBasePlugin, ElectronBasePluginClient } from "@remixproject/plugin-electron"
import { Profile } from "@remixproject/plugin-utils"
import { getInstallationPath, circomCli, extractParentFromKey, getInstallationUrl, getLogInputSignalsPath, extractNameFromKey } from "../tools/circom"
import path from "path"
import { existsSync, readFileSync } from "fs"

const profile: Profile = {
  displayName: 'circom',
  name: 'circom',
  description: 'Circom language compiler'
}

export class CircomElectronPlugin extends ElectronBasePlugin {
  clients: CircomElectronPluginClient[] = []

  constructor() {
    super(profile, clientProfile, CircomElectronPluginClient)
    this.methods = [...super.methods]
  }
}

const clientProfile: Profile = {
  name: 'circom',
  displayName: 'circom',
  description: 'Circom Language Compiler',
  methods: ['install', 'run', 'getInputs', 'isVersionInstalled']
}

class CircomElectronPluginClient extends ElectronBasePluginClient {
  isCircomInstalled: boolean = false

  constructor(webContentsId: number, profile: Profile) {
    super(webContentsId, profile)
    this.onload()
  }

  async install(version = 'latest') {
    this.call('terminal' as any, 'logHtml', `Checking if circom compiler (${version}) is installed in ${getInstallationPath(version)}`)
   
    this.isCircomInstalled = await circomCli.isCircomInstalled(version)
    if (!this.isCircomInstalled) {
      this.call('terminal' as any, 'logHtml', 'Downloading circom compiler from ' + getInstallationUrl(version))
      await circomCli.installCircom(version)
      this.isCircomInstalled = true
      this.call('terminal' as any, 'logHtml', `Circom compiler (${version}) downloaded from ${getInstallationUrl(version)} to ${getInstallationPath(version)}`)
    }
  }

  async run(filePath: string, version = 'latest', options: Record<string, string>) {
    if (!this.isCircomInstalled) await this.install(version)
    // @ts-ignore
    const wd = await this.call('fs', 'getWorkingDir')
    const binDir = path.join(wd, path.join(extractParentFromKey(filePath), '.bin'))
    // @ts-ignore
    const outputDirExists = await this.call('fs', 'exists', path.join(extractParentFromKey(filePath), '.bin'))
    // @ts-ignore
    if (!outputDirExists) await this.call('fs', 'mkdir', path.join(extractParentFromKey(filePath), '.bin'))
    else {
      // @ts-ignore
      if (process.platform === 'win32' && 'wasm' in options) {
        try{
          // @ts-ignore
          await this.call('fs', 'rmdir', path.join(extractParentFromKey(filePath), '.bin', extractNameFromKey(filePath).replace('.circom', '_js')))
        } catch (e) {
        }
      }
    }
    filePath = path.join(wd, filePath)
    const depPath = path.join(wd, '.deps/https/raw.githubusercontent.com/iden3/')
    const outputDir = process.platform !== 'win32' ? path.normalize(extractParentFromKey(filePath) + '/' + '.bin') : binDir

    this.call('terminal' as any, 'logHtml', `Compiling ${filePath} with circom compiler (${version})`)
    return await circomCli.run(`${filePath} -l ${depPath} -o ${outputDir}`, version, options)
  }

  getInputs() {
    const inputsFile = getLogInputSignalsPath()
    const inputsFileExists = existsSync(inputsFile)
    const signals: string[] = []

    if (inputsFileExists) {
      const inputsContent = readFileSync(inputsFile, 'utf-8')
      const regexPattern = /main\.(\w+)/g

      let match
      while ((match = regexPattern.exec(inputsContent)) !== null) {
        signals.push(match[1])
      }
      return signals
    }
  }

  async isVersionInstalled(version: string) {
    return await circomCli.isCircomInstalled(version)
  }
}