import { PluginClient } from "@remixproject/plugin";
import { createClient } from "@remixproject/plugin-webview";
import { CompilerApiMixin } from './compiler-api'

const profile = {
  name: 'solidity',
  displayName: 'Solidity compiler',
  icon: 'assets/img/solidity.webp',
  description: 'Compile solidity contracts',
  kind: 'compiler',
  permission: true,
  location: 'sidePanel',
  documentation: 'https://remix-ide.readthedocs.io/en/latest/solidity_editor.html',
  version: '0.0.1',
  methods: ['getCompilationResult', 'compile', 'compileWithParameters', 'setCompilerConfig', 'compileFile' ,'getCompilerState']
}

export interface ConfigurationSettings {
  version: string,
  evmVersion: string,
  language: string,
  optimize: boolean,
  runs: string
}

export class CompilerClientApi extends CompilerApiMixin(PluginClient) {
  contractMap: {
    file: string
  } | Record<string, any>
  compileErrors: any
  compileTabLogic: any
  contractsDetails: Record<string, any>
  contentImport: any
  call: (...args) => void
  on: (...args) => void
  setSelectedVersion: (value: string) => void
  configurationSettings: ConfigurationSettings
  getConfiguration: (value: string) => string
  setConfiguration: (name: string, value: string) => void
  currentFile: string

  onCurrentFileChanged: (fileName: string) => void
  onResetResults: () => void
  onSetWorkspace: (workspace: any) => void
  onNoFileSelected: () => void
  onCompilationFinished: (contractsDetails: any, contractMap: any) => void

  constructor () {
    super()
    createClient(this as any)
    this.initCompilerApi()
  }  
}
