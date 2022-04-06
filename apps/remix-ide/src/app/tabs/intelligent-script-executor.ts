import { Plugin } from '@remixproject/engine'
import * as packageJson from '../../../../../package.json'
const _paq = window._paq = window._paq || []

export const profile = {
  name: 'intelligentScriptExecutor',
  displayName: 'Intelligent Script Executor',
  description: 'after each compilation, run the script defined in Natspec.',
  methods: [],
  version: packageJson.version,
  kind: 'none'
}

type listener = (event: KeyboardEvent) => void

export class IntelligentScriptExecutor extends Plugin {
  executionListener: listener
  targetFileName: string

  constructor () {
    super(profile)
    this.executionListener = async (e) => {
      // ctrl+e or command+e
      const file = await this.call('fileManager', 'file')
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.keyCode === 83 && file !== '') {
        if (file.endsWith('.sol')) {
          e.preventDefault()
          this.targetFileName = file
          await this.call('solidity', 'compile', file)
          _paq.push(['trackEvent', 'ScriptExecutor', 'compile_solidity'])
        } else if (file.endsWith('.js') || file.endsWith('.ts')) {
          e.preventDefault()
          this.runScript(file, false)
          _paq.push(['trackEvent', 'ScriptExecutor', 'run_script'])
        }
      }
    }
  }

  async runScript (fileName, clearAllInstances) {
    await this.call('terminal', 'log', `running ${fileName} ...`)
    const content = await this.call('fileManager', 'readFile', fileName)
    if (clearAllInstances) {
      await this.call('udapp', 'clearAllInstances')
    }
    await this.call('scriptRunner', 'execute', content)
  }

  onActivation () {
    window.document.addEventListener('keydown', this.executionListener)

    this.on('compilerMetadata', 'artefactsUpdated', async (fileName, contract) => {
      if (this.targetFileName === contract.file && contract.object && contract.object.devdoc['custom:dev-run-script']) {
        this.targetFileName = null
        const file = contract.object.devdoc['custom:dev-run-script']
        if (file) {
          this.runScript(file, true)
          _paq.push(['trackEvent', 'ScriptExecutor', 'run_script_after_compile'])
        } 
      }
    })
  }

  onDeactivation () {
    window.document.removeEventListener('keydown', this.executionListener)
    this.off('compilerMetadata', 'artefactsUpdated')
  }
}
