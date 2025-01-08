import { PluginClient } from '@remixproject/plugin'
import { createClient } from '@remixproject/plugin-webview'
import EventManager from 'events'
// @ts-ignore
import { compile_program, createFileManager } from '@noir-lang/noir_wasm/default'
import type { FileManager } from '@noir-lang/noir_wasm/dist/node/main'

const DEFAULT_TOML_CONFIG = `[package]
name = "test"
authors = [""]
compiler_version = ">=0.18.0"
type = "bin"

[dependencies]
`
export class NoirPluginClient extends PluginClient {
  public internalEvents: EventManager
  public fm: FileManager

  constructor() {
    super()
    this.methods = ['init', 'parse', 'compile']
    createClient(this)
    this.internalEvents = new EventManager()
    this.fm = createFileManager('/')
    const fileBytes = new TextEncoder().encode(DEFAULT_TOML_CONFIG)

    this.fm.writeFile('Nargo.toml', new Blob([fileBytes]).stream())
    this.onload()
  }

  init(): void {
    console.log('initializing noir plugin...')
  }

  onActivation(): void {
    this.internalEvents.emit('noir_activated')
  }

  async compile(path: string): Promise<void> {
    // @ts-ignore
    const fileContent = await this.call('fileManager', 'readFile', path)
    const fileBytes = new TextEncoder().encode(fileContent)

    this.fm.writeFile(`src/${path}`, new Blob([fileBytes]).stream())
    const program = await compile_program(this.fm)

    console.log('program: ', program)
  }

  async parse(path: string): Promise<void> {
  }
}
