'use strict'
import FileProvider from "./fileProvider"

export default class RemixDProvider extends FileProvider {
  constructor (appManager) {
    super('localhost')
    this._appManager = appManager
    this.error = { EEXIST: 'File already exists' }
    this._isReady = false
    this._readOnlyFiles = {}
    this._readOnlyMode = false
    this.filesContent = {}
    this.files = {}
  }

  _registerEvent () {
    var remixdEvents = ['connecting', 'connected', 'errored', 'closed']
    remixdEvents.forEach((event) => {
      this._appManager.on('remixd', event, (value) => {
        this.event.emit(event, value)
      })
    })

    this._appManager.on('remixd', 'folderAdded', (path) => {
      this.event.emit('folderAdded', path)
    })

    this._appManager.on('remixd', 'fileAdded', (path) => {
      this.event.emit('fileAdded', path)
    })

    this._appManager.on('remixd', 'fileChanged', (path) => {
      this.event.emit('fileChanged', path)
    })

    this._appManager.on('remixd', 'fileRemoved', (path) => {
      this.event.emit('fileRemoved', path)
    })

    this._appManager.on('remixd', 'fileRenamed', (oldPath, newPath) => {
      this.event.emit('fileRenamed', oldPath, newPath)
    })

    this._appManager.on('remixd', 'rootFolderChanged', (path) => {
      this.event.emit('rootFolderChanged', path)
    })

    this._appManager.on('remixd', 'removed', (path) => {
      this.event.emit('fileRemoved', path)
    })

    this._appManager.on('remixd', 'changed', (path) => {
      this.get(path, (_error, content) => {
        this.event.emit('fileExternallyChanged', path, content)
      })
    })
  }

  isConnected () {
    return this._isReady
  }

  close (cb) {
    this._isReady = false
    cb()
    this.event.emit('disconnected')
  }

  preInit () {
    this.event.emit('loadingLocalhost')
  }

  init (cb) {
    if (this._isReady) return cb && cb()
    this._appManager.call('remixd', 'folderIsReadOnly', {})
      .then((result) => {
        this._isReady = true
        this._readOnlyMode = result
        this.event.emit('readOnlyModeChanged', result)
        this._registerEvent()
        this.event.emit('connected')
        cb && cb()
      }).catch((error) => {
        cb && cb(error)
      })
  }

  exists (path) {
    if (!this._isReady) throw new Error('provider not ready')
    const unprefixedpath = this.removePrefix(path)

    return this._appManager.call('remixd', 'exists', { path: unprefixedpath })
      .then((result) => {
        return result
      })
      .catch((error) => {
        throw new Error(error)
      })
  }

  async get (path, cb) {
    if (!this._isReady) return cb && cb('provider not ready')
    var unprefixedpath = this.removePrefix(path)
    try{
      const file = await this._appManager.call('remixd', 'get', { path: unprefixedpath })
      this.filesContent[path] = file.content
      if (file.readonly) { this._readOnlyFiles[path] = 1 }
      if(cb) cb(null, file.content)
      return file.content
    } catch(error) {
      if (error) console.log(error)
      if(cb) return cb(null, this.filesContent[path])
    }
  }

  async set (path, content, cb) {
    if (!this._isReady) return cb && cb('provider not ready')
    const unprefixedpath = this.removePrefix(path)

    return this._appManager.call('remixd', 'set', { path: unprefixedpath, content: content }).then(async (result) => {
      if (cb) return cb(null, result)
    }).catch((error) => {
      if (cb) return cb(error)
      throw new Error(error)
    })
  }

  async createDir (path, cb) {
    if (!this._isReady) return cb && cb('provider not ready')
    const unprefixedpath = this.removePrefix(path)

    return this._appManager.call('remixd', 'createDir', { path: unprefixedpath })
  }

  isReadOnly (path) {
    return this._readOnlyMode || this._readOnlyFiles[path] === 1
  }

  remove (path) {
    return new Promise((resolve, reject) => {
      if (!this._isReady) return reject(new Error('provider not ready'))
      const unprefixedpath = this.removePrefix(path)
      this._appManager.call('remixd', 'remove', { path: unprefixedpath })
        .then(result => {
          const path = unprefixedpath
          delete this.filesContent[path]
          resolve(true)
          this.init()
        }).catch(error => {
          if (error) console.log(error)
          resolve(false)
        })
    })
  }

  rename (oldPath, newPath, isFolder) {
    const unprefixedoldPath = this.removePrefix(oldPath)
    const unprefixednewPath = this.removePrefix(newPath)
    if (!this._isReady) return new Promise((resolve, reject) => reject(new Error('provider not ready')))
    return this._appManager.call('remixd', 'rename', { oldPath: unprefixedoldPath, newPath: unprefixednewPath })
      .then(result => {
        const newPath = unprefixednewPath
        const oldPath = unprefixedoldPath

        this.filesContent[newPath] = this.filesContent[oldPath]
        delete this.filesContent[oldPath]
        this.init(() => {
          this.event.emit('fileRenamed', oldPath, newPath, isFolder)
        })
        return result
      }).catch(error => {
        console.log(error)
        if (this.error[error.code]) error = this.error[error.code]
        this.event.emit('fileRenamedError', this.error[error.code])
      })
  }

  isExternalFolder (path) {
    return false
  }

  removePrefix (path) {
    path = path.indexOf(this.type) === 0 ? path.replace(this.type, '') : path
    if (path[0] === '/') return path.substring(1)
    if (path === '') return '/'
    return path
  }

  resolveDirectory (path, callback) {
    if (path[0] === '/') path = path.substring(1)
    const unprefixedpath = this.removePrefix(path)

    if (!this._isReady) return callback && callback('provider not ready')
    this._appManager.call('remixd', 'resolveDirectory', { path: unprefixedpath }).then((result) => {
      callback(null, result)
    }).catch(callback)
  }

  async isDirectory (path) {
    const unprefixedpath = this.removePrefix(path)
    if (!this._isReady) throw new Error('provider not ready')
    return await this._appManager.call('remixd', 'isDirectory', { path: unprefixedpath })
  }

  async isFile (path) {
    const unprefixedpath = this.removePrefix(path)
    if (!this._isReady) throw new Error('provider not ready')
    return await this._appManager.call('remixd', 'isFile', { path: unprefixedpath })
  }
}
