export type onCurrentFileChanged = (fileName: string) => void

export interface SolidityCompilerProps {
  plugin: {
    currentFile: string
    contractMap: {
      file: string
    } | Record<string, any>
    compileErrors: any,
    compileTabLogic: any,
    contractsDetails: Record<string, any>,
    contentImport: any,
    call: (...args) => void
    on: (...args) => void,
    setSelectedVersion: (value: string) => void,
    configurationSettings: ConfigurationSettings,
    getConfiguration: (value: string) => string,
    setConfiguration: (name: string, value: string) => void,
    onCurrentFileChanged: (fileName: string) => void,
    onResetResults: () => void,
    onSetWorkspace: (workspace: any) => void,
    onNoFileSelected: () => void,
    onCompilationFinished: (contractsDetails: any, contractMap: any) => void
  },
}

export interface CompilerContainerProps {
  api: any,
  compileTabLogic: any,
  isHardhatProject: boolean,
  tooltip: (message: string | JSX.Element) => void,
  modal: (title: string, message: string | JSX.Element, okLabel: string, okFn: () => void, cancelLabel?: string, cancelFn?: () => void) => void,
  compiledFileName: string,
  updateCurrentVersion: any,
  configurationSettings: ConfigurationSettings
}
export interface ContractSelectionProps {
  api: any,
  contractMap: {
    file: string
  } | Record<string, any>,
  modal: (title: string, message: string | JSX.Element, okLabel: string, okFn: () => void, cancelLabel?: string, cancelFn?: () => void) => void,
  contractsDetails: Record<string, any>
}

export interface ConfigurationSettings {
  version: string,
  evmVersion: string,
  language: string,
  optimize: boolean,
  runs: string
}
