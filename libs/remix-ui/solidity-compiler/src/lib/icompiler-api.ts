export type onCurrentFileChanged = (fileName: string) => void

export interface ICompilerApi {
    contractMap: {
        file: string
      } | Record<string, any>
    
    compileErrors:any
    
    currentFile: string
    configurationSettings: any
    setHardHatCompilation(value: boolean): void
    setSelectedVersion(version: string): void
    getCompilationResult(): any
    setCompilerConfig: (settings: any) => void
    getParameters: () => any
    setParameters: (params) => void
    getConfiguration: (name: string) => string
    setConfiguration: (name: string, value: string) => void
    fileProviderOf: (file: string) => string
    getFileManagerMode: () => string
    fileExists: (file: string) => Promise<boolean>
    writeFile: (file: string, content: string) => Promise<void>
    readFile: (file: string) => Promise<string>
    open: (file: string) => void
    onCurrentFileChanged: (listener: onCurrentFileChanged) => void
}
