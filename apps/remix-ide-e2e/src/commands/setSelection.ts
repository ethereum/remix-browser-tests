import { NightwatchBrowser } from 'nightwatch'
import EventEmitter from 'events'

class SetSelection extends EventEmitter {
  command (this: NightwatchBrowser, startLine: number, startColumn: number, endLine: number, endColumn: number): NightwatchBrowser {
    this.api.execute(function (startLine, startColumn, endLine, endColumn) {
      const elem: any = document.getElementById('editorView')

      elem.setSelection(startLine, startColumn, endLine, endColumn)
    }, [startLine, startColumn, endLine, endColumn], () => {
      this.emit('complete')
    })
    return this
  }
}

module.exports = SetSelection
