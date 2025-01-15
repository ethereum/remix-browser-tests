'use strict'

const EventManager = require('events')
import FileProvider from "./fileProvider"

export default class WorkspaceFileProvider extends FileProvider {
  constructor () {
    super('')
    this.workspacesPath = '.workspaces'
    this.workspace = null
    this.event = new EventManager()

    try {
      // make sure "code-sample" has been removed
      window.remixFileSystem.exists(this.workspacesPath + '/code-sample').then((exist) => {
        if (exist) window.remixFileSystem.unlink(this.workspacesPath + '/code-sample').catch((e) => {
          console.log(e)
        })
      }).catch((e) => {
        console.log(e)
      })
    } catch (e) {
      // we don't need to log error if this throws an error
    }
  }

  setWorkspace (workspace) {
    if (!workspace) return
    workspace = workspace.replace(/^\/|\/$/g, '') // remove first and last slash
    this.workspace = workspace
  }

  getWorkspace () {
    return this.workspace
  }

  isReady () {
    return this.workspace !== null
  }

  clearWorkspace () {
    this.workspace = null
  }

  removePrefix (path) {
    if (!path) path = '/'
    path = path.replace(/^\/|\/$/g, '') // remove first and last slash
    path = path.replace(/^\.\/+/, '') // remove ./ from start of string
    if (path.startsWith(this.workspacesPath + '/' + this.workspace)) return path
    path = super.removePrefix(path)
    let ret = this.workspacesPath + '/' + this.workspace + '/' + (path === '/' ? '' : path)

    ret = ret.replace(/^\/|\/$/g, '')
    if (!this.isSubDirectory(this.workspacesPath + '/' + this.workspace, ret)) throw new Error('Cannot read/write to path outside workspace')
    return ret
  }

  resolveDirectory (path, callback) {
    super.resolveDirectory(path, (error, files) => {
      if (error) return callback(error)
      const unscoped = {}
      for (const file in files) {
        unscoped[file.replace(this.workspacesPath + '/' + this.workspace + '/', '')] = files[file]
      }
      callback(null, unscoped)
    })
  }

  async copyFolderToJson (directory, visitFile, visitFolder) {
    visitFile = visitFile || function () { /* do nothing. */ }
    visitFolder = visitFolder || function () { /* do nothing. */ }
    const regex = new RegExp(`.workspaces/${this.workspace}/`, 'g')
    let json = await super._copyFolderToJsonInternal(directory, ({ path, content }) => {
      visitFile({ path: path.replace(regex, ''), content })
    }, ({ path }) => {
      visitFolder({ path: path.replace(regex, '') })
    })
    json = JSON.stringify(json).replace(regex, '')
    return JSON.parse(json)
  }

  _normalizePath (path) {
    return path.replace(this.workspacesPath + '/' + this.workspace + '/', '')
  }

  async createWorkspace (name) {
    try {
      if (!name) name = 'default_workspace'
      const path = this.workspacesPath + '/' + name

      await super.forceCreateDir(path)
      this.setWorkspace(name)
      this.event.emit('createWorkspace', name)
    } catch (e) {
      throw new Error(e)
    }
  }
}

module.exports = WorkspaceFileProvider
