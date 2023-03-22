import { PluginClient } from '@remixproject/plugin'
import { CompilationResult, SourceWithTarget } from '@remixproject/plugin-api'
import { createClient } from '@remixproject/plugin-webview'
import EventEmitter from 'events'
import { Config, defaults } from './docgen/config'
import { Build, buildSite } from './docgen/site'
import { loadTemplates } from './docgen/templates'
import { SolcInput, SolcOutput } from 'solidity-ast/solc'
import { render } from './docgen/render'

export class DocGenClient extends PluginClient {
  private currentTheme
  public eventEmitter: EventEmitter
  private build: Build
  public docs: string[] = []
  private fileName: string = ''
  
  constructor() {
    super()
    this.eventEmitter = new EventEmitter()
    this.methods = ['generateDocs', 'openDocs']
    createClient(this)
    this.onload().then(async () => {
      await this.setListeners()
    })
  }

  async setListeners() {
    this.currentTheme = await this.call('theme', 'currentTheme')
    
    this.on('theme', 'themeChanged', (theme: any) => {
      this.currentTheme = theme
      this.eventEmitter.emit('themeChanged', this.currentTheme)
    });
    this.eventEmitter.emit('themeChanged', this.currentTheme)

    this.on('solidity', 'compilationFinished', (fileName: string, source: SourceWithTarget, languageVersion: string, data: CompilationResult) => {
      const input: SolcInput = {
        sources: source.sources
      }
      const output: SolcOutput = {
        sources: data.sources as any
      }
      this.build = {
        input: input,
        output: output
      }
      this.fileName = fileName
      this.eventEmitter.emit('compilationFinished', this.build, fileName)
    })
  }

  async docgen(builds: Build[], userConfig?: Config): Promise<void> {
    const config = { ...defaults, ...userConfig }
    const templates = await loadTemplates(config.theme, config.root, config.templates)
    const site = buildSite(builds, config, templates.properties ?? {})
    const renderedSite = render(site, templates, config.collapseNewlines)
    const docs: string[] = []
    for (const { id, contents } of renderedSite) {
      const temp = `${this.fileName.split('/')[1].split('.')[0]}.${id.split('.')[1]}`
      const newFileName = `docs/${temp}`
      await this.call('fileManager', 'setFile', newFileName , contents)
      docs.push(newFileName)
    }
    this.eventEmitter.emit('docsGenerated', docs)
    this.emit('docgen' as any, 'docsGenerated', docs)
    this.docs = docs
    await this.openDocs(docs)
  }

  async openDocs(docs: string[]) {
    await this.call('manager', 'activatePlugin', 'doc-viewer')
    await this.call('tabs' as any, 'focus', 'doc-viewer')
    await this.call('doc-viewer' as any, 'viewDocs', docs)
  }

  async generateDocs() {
    this.docgen([this.build])
  }
}
