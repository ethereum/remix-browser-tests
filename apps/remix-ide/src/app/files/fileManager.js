'use strict'

import yo from 'yo-yo'
import async from 'async'
import { Plugin } from '@remixproject/engine'
import * as packageJson from '../../../../../package.json'
const EventEmitter = require('events')
const globalRegistry = require('../../global/registry')
const toaster = require('../ui/tooltip')
const modalDialogCustom = require('../ui/modal-dialog-custom')
const helper = require('../../lib/helper.js')

/*
  attach to files event (removed renamed)
  trigger: currentFileChanged
*/

const profile = {
  name: 'fileManager',
  displayName: 'File manager',
  description: 'Service - read/write to any files or folders, require giving permissions',
  icon: 'assets/img/fileManager.webp',
  permission: true,
  version: packageJson.version,
  methods: ['file', 'exists', 'open', 'writeFile', 'readFile', 'copyFile', 'copyDir', 'rename', 'mkdir', 'readdir', 'remove', 'getCurrentFile', 'getFile', 'getFolder', 'setFile', 'switchFile', 'refresh', 'getProviderOf', 'getProviderByName', 'getPathFromUrl', 'getUrlFromPath'],
  kind: 'file-system'
}
const errorMsg = {
  ENOENT: 'No such file or directory',
  EISDIR: 'Path is a directory',
  ENOTDIR: 'Path is not on a directory',
  EEXIST: 'File already exists',
  EPERM: 'Permission denied'
}
const createError = (err) => {
  return new Error(`${errorMsg[err.code]} ${err.message || ''}`)
}

class FileManager extends Plugin {
  constructor (editor, appManager) {
    super(profile)
    this.mode = 'browser'
    this.openedFiles = {} // list all opened files
    this.events = new EventEmitter()
    this.editor = editor
    this._components = {}
    this._components.registry = globalRegistry
    this.appManager = appManager
    this.init()
  }

  getOpenedFiles () {
    return this.openedFiles
  }

  setMode (mode) {
    this.mode = mode
  }

  limitPluginScope (path) {
    return path.replace(/^\/browser\//, '').replace(/^browser\//, '') // forbids plugin to access the root filesystem
  }

  /**
   * Emit error if path doesn't exist
   * @param {string} path path of the file/directory
   * @param {string} message message to display if path doesn't exist.
   */
  async _handleExists (path, message) {
    const exists = await this.exists(path)

    if (!exists) {
      throw createError({ code: 'ENOENT', message })
    }
  }

  /**
   * Emit error if path is not a file
   * @param {string} path path of the file/directory
   * @param {string} message message to display if path is not a file.
   */
  async _handleIsFile (path, message) {
    const isFile = await this.isFile(path)

    if (!isFile) {
      throw createError({ code: 'EISDIR', message })
    }
  }

  /**
   * Emit error if path is not a directory
   * @param {string} path path of the file/directory
   * @param {string} message message to display if path is not a directory.
   */
  async _handleIsDir (path, message) {
    const isDir = await this.isDirectory(path)

    if (!isDir) {
      throw createError({ code: 'ENOTDIR', message })
    }
  }

  /** The current opened file */
  file () {
    try {
      const file = this.currentFile()

      if (!file) throw createError({ code: 'ENOENT', message: 'No file selected' })
      return file
    } catch (e) {
      throw new Error(e)
    }
  }

  /**
   * Verify if the path exists (directory or file)
   * @param {string} path path of the directory or file
   * @returns {boolean} true if the path exists
   */
  exists (path) {
    try {
      path = this.limitPluginScope(path)
      const provider = this.fileProviderOf(path)
      const result = provider.exists(path)

      return result
    } catch (e) {
      throw new Error(e)
    }
  }

  /*
  * refresh the file explorer
  */
  refresh () {
    const provider = this.fileProviderOf('/')
    // emit rootFolderChanged so that File Explorer reloads the file tree
    provider.event.emit('rootFolderChanged')
  }

  /**
   * Verify if the path provided is a file
   * @param {string} path path of the directory or file
   * @returns {boolean} true if path is a file.
   */
  isFile (path) {
    const provider = this.fileProviderOf(path)
    const result = provider.isFile(path)

    return result
  }

  /**
   * Verify if the path provided is a directory
   * @param {string} path path of the directory
   * @returns {boolean} true if path is a directory.
   */
  async isDirectory (path) {
    const provider = this.fileProviderOf(path)
    const result = await provider.isDirectory(path)

    return result
  }

  /**
   * Open the content of the file in the context (eg: Editor)
   * @param {string} path path of the file
   * @returns {void}
   */
  async open (path) {
    path = this.limitPluginScope(path)
    path = this.getPathFromUrl(path).file
    await this._handleExists(path, `Cannot open file ${path}`)
    await this._handleIsFile(path, `Cannot open file ${path}`)
    await this.openFile(path)
  }

  /**
   * Set the content of a specific file
   * @param {string} path path of the file
   * @param {string} data content to write on the file
   * @returns {void}
   */
  async writeFile (path, data) {
    try {
      path = this.limitPluginScope(path)
      if (await this.exists(path)) {
        await this._handleIsFile(path, `Cannot write file ${path}`)
        return await this.setFileContent(path, data)
      } else {
        const ret = await this.setFileContent(path, data)
        this.emit('fileAdded', path)
        return ret
      }
    } catch (e) {
      throw new Error(e)
    }
  }

  /**
   * Return the content of a specific file
   * @param {string} path path of the file
   * @returns {string} content of the file
   */
  async readFile (path) {
    try {
      path = this.limitPluginScope(path)
      await this._handleExists(path, `Cannot read file ${path}`)
      await this._handleIsFile(path, `Cannot read file ${path}`)
      return this.getFileContent(path)
    } catch (e) {
      throw new Error(e)
    }
  }

  /**
   * Upsert a file with the content of the source file
   * @param {string} src path of the source file
   * @param {string} dest path of the destrination file
   * @returns {void}
   */
  async copyFile (src, dest, customName) {
    try {
      src = this.limitPluginScope(src)
      dest = this.limitPluginScope(dest)
      await this._handleExists(src, `Cannot copy from ${src}. Path does not exist.`)
      await this._handleIsFile(src, `Cannot copy from ${src}. Path is not a file.`)
      await this._handleExists(dest, `Cannot paste content into ${dest}. Path does not exist.`)
      await this._handleIsDir(dest, `Cannot paste content into ${dest}. Path is not directory.`)
      const content = await this.readFile(src)
      let copiedFilePath = dest + (customName ? '/' + customName : '/' + `Copy_${helper.extractNameFromKey(src)}`)
      copiedFilePath = await helper.createNonClashingNameAsync(copiedFilePath, this)

      await this.writeFile(copiedFilePath, content)
    } catch (e) {
      throw new Error(e)
    }
  }

  /**
   * Upsert a directory with the content of the source directory
   * @param {string} src path of the source dir
   * @param {string} dest path of the destination dir
   * @returns {void}
   */
  async copyDir (src, dest) {
    try {
      src = this.limitPluginScope(src)
      dest = this.limitPluginScope(dest)
      await this._handleExists(src, `Cannot copy from ${src}. Path does not exist.`)
      await this._handleIsDir(src, `Cannot copy from ${src}. Path is not a directory.`)
      await this._handleExists(dest, `Cannot paste content into ${dest}. Path does not exist.`)
      await this._handleIsDir(dest, `Cannot paste content into ${dest}. Path is not directory.`)
      await this.inDepthCopy(src, dest)
    } catch (e) {
      throw new Error(e)
    }
  }

  async inDepthCopy (src, dest, count = 0) {
    const content = await this.readdir(src)
    let copiedFolderPath = count === 0 ? dest + '/' + `Copy_${helper.extractNameFromKey(src)}` : dest + '/' + helper.extractNameFromKey(src)
    copiedFolderPath = await helper.createNonClashingDirNameAsync(copiedFolderPath, this)

    await this.mkdir(copiedFolderPath)

    for (const [key, value] of Object.entries(content)) {
      if (!value.isDirectory) {
        await this.copyFile(key, copiedFolderPath, helper.extractNameFromKey(key))
      } else {
        await this.inDepthCopy(key, copiedFolderPath, count + 1)
      }
    }
  }

  /**
   * Change the path of a file/directory
   * @param {string} oldPath current path of the file/directory
   * @param {string} newPath new path of the file/directory
   * @returns {void}
   */
  async rename (oldPath, newPath) {
    try {
      oldPath = this.limitPluginScope(oldPath)
      newPath = this.limitPluginScope(newPath)
      await this._handleExists(oldPath, `Cannot rename ${oldPath}`)
      const isFile = await this.isFile(oldPath)
      const newPathExists = await this.exists(newPath)
      const provider = this.fileProviderOf(oldPath)

      if (isFile) {
        if (newPathExists) {
          modalDialogCustom.alert('File already exists.')
          return
        }
        return provider.rename(oldPath, newPath, false)
      } else {
        if (newPathExists) {
          modalDialogCustom.alert('Folder already exists.')
          return
        }
        return provider.rename(oldPath, newPath, true)
      }
    } catch (e) {
      throw new Error(e)
    }
  }

  /**
   * Create a directory
   * @param {string} path path of the new directory
   * @returns {void}
   */
  async mkdir (path) {
    try {
      path = this.limitPluginScope(path)
      if (await this.exists(path)) {
        throw createError({ code: 'EEXIST', message: `Cannot create directory ${path}` })
      }
      const provider = this.fileProviderOf(path)

      return provider.createDir(path)
    } catch (e) {
      throw new Error(e)
    }
  }

  /**
   * Get the list of files in the directory
   * @param {string} path path of the directory
   * @returns {string[]} list of the file/directory name in this directory
   */
  async readdir (path) {
    try {
      path = this.limitPluginScope(path)
      await this._handleExists(path)
      await this._handleIsDir(path)

      return new Promise((resolve, reject) => {
        const provider = this.fileProviderOf(path)

        provider.resolveDirectory(path, (error, filesProvider) => {
          if (error) reject(error)
          resolve(filesProvider)
        })
      })
    } catch (e) {
      throw new Error(e)
    }
  }

  /**
   * Removes a file or directory recursively
   * @param {string} path path of the directory/file to remove
   * @returns {void}
   */
  async remove (path) {
    try {
      path = this.limitPluginScope(path)
      await this._handleExists(path, `Cannot remove file or directory ${path}`)
      const provider = this.fileProviderOf(path)
      return await provider.remove(path)
    } catch (e) {
      throw new Error(e)
    }
  }

  init () {
    this._deps = {
      config: this._components.registry.get('config').api,
      browserExplorer: this._components.registry.get('fileproviders/browser').api,
      localhostExplorer: this._components.registry.get('fileproviders/localhost').api,
      workspaceExplorer: this._components.registry.get('fileproviders/workspace').api,
      filesProviders: this._components.registry.get('fileproviders').api
    }
    this._deps.browserExplorer.event.on('fileChanged', (path) => { this.fileChangedEvent(path) })
    this._deps.browserExplorer.event.on('fileRenamed', (oldName, newName, isFolder) => { this.fileRenamedEvent(oldName, newName, isFolder) })
    this._deps.localhostExplorer.event.on('fileRenamed', (oldName, newName, isFolder) => { this.fileRenamedEvent(oldName, newName, isFolder) })
    this._deps.browserExplorer.event.on('fileRemoved', (path) => { this.fileRemovedEvent(path) })
    this._deps.browserExplorer.event.on('fileAdded', (path) => { this.fileAddedEvent(path) })
    this._deps.localhostExplorer.event.on('fileRemoved', (path) => { this.fileRemovedEvent(path) })
    this._deps.localhostExplorer.event.on('errored', (event) => { this.removeTabsOf(this._deps.localhostExplorer) })
    this._deps.localhostExplorer.event.on('closed', (event) => { this.removeTabsOf(this._deps.localhostExplorer) })
    this._deps.workspaceExplorer.event.on('fileChanged', (path) => { this.fileChangedEvent(path) })
    this._deps.workspaceExplorer.event.on('fileRenamed', (oldName, newName, isFolder) => { this.fileRenamedEvent(oldName, newName, isFolder) })
    this._deps.workspaceExplorer.event.on('fileRemoved', (path) => { this.fileRemovedEvent(path) })
    this._deps.workspaceExplorer.event.on('fileAdded', (path) => { this.fileAddedEvent(path) })

    this.getCurrentFile = this.file
    this.getFile = this.readFile
    this.getFolder = this.readdir
    this.setFile = this.writeFile
    this.switchFile = this.open
  }

  fileAddedEvent (path) {
    this.emit('fileAdded', path)
  }

  fileChangedEvent (path) {
    this.emit('currentFileChanged', path)
  }

  fileRenamedEvent (oldName, newName, isFolder) {
    if (!isFolder) {
      this._deps.config.set('currentFile', '')
      this.editor.discard(oldName)
      if (this.openedFiles[oldName]) {
        delete this.openedFiles[oldName]
        this.openedFiles[newName] = newName
      }
      this.openFile(newName)
    } else {
      for (var k in this.openedFiles) {
        if (k.indexOf(oldName + '/') === 0) {
          var newAbsolutePath = k.replace(oldName, newName)
          this.openedFiles[newAbsolutePath] = newAbsolutePath
          delete this.openedFiles[k]
          if (this._deps.config.get('currentFile') === k) {
            this._deps.config.set('currentFile', '')
          }
        }
      }
    }
    // TODO: Only keep `this.emit` (issue#2210)
    this.emit('fileRenamed', oldName, newName, isFolder)
    this.events.emit('fileRenamed', oldName, newName, isFolder)
  }

  currentFileProvider () {
    var path = this.currentPath()
    if (path) {
      return this.fileProviderOf(path)
    }
    return null
  }

  currentFile () {
    return this._deps.config.get('currentFile')
  }

  closeAllFiles () {
    // TODO: Only keep `this.emit` (issue#2210)
    this.emit('filesAllClosed')
    this.events.emit('filesAllClosed')
    for (const file in this.openedFiles) {
      this.closeFile(file)
    }
  }

  closeFile (name) {
    delete this.openedFiles[name]
    if (!Object.keys(this.openedFiles).length) {
      this._deps.config.set('currentFile', '')
      // TODO: Only keep `this.emit` (issue#2210)
      this.emit('noFileSelected')
      this.events.emit('noFileSelected')
    }
    // TODO: Only keep `this.emit` (issue#2210)
    this.emit('fileClosed', name)
    this.events.emit('fileClosed', name)
  }

  currentPath () {
    var currentFile = this._deps.config.get('currentFile')
    return this.extractPathOf(currentFile)
  }

  extractPathOf (file) {
    var reg = /(.*)(\/).*/
    var path = reg.exec(file)
    return path ? path[1] : '/'
  }

  getFileContent (path) {
    const provider = this.fileProviderOf(path)

    if (!provider) throw createError({ code: 'ENOENT', message: `${path} not available` })
    // TODO: change provider to Promise
    return new Promise((resolve, reject) => {
      if (this.currentFile() === path) return resolve(this.editor.currentContent())
      provider.get(path, (err, content) => {
        if (err) reject(err)
        resolve(content)
      })
    })
  }

  async setFileContent (path, content) {
    if (this.currentRequest) {
      const canCall = await this.askUserPermission('writeFile', '')
      if (canCall) {
        // inform the user about modification after permission is granted and even if permission was saved before
        toaster(yo`
          <div>
            <i class="fas fa-exclamation-triangle text-danger mr-1"></i>
            <span>
              ${this.currentRequest.from}
              <span class="font-weight-bold text-warning">
                is modifying 
              </span>${path}
            </span>
          </div>
        `, '', { time: 3000 })
      }
    }
    return await this._setFileInternal(path, content)
  }

  _setFileInternal (path, content) {
    const provider = this.fileProviderOf(path)
    if (!provider) throw createError({ code: 'ENOENT', message: `${path} not available` })
    // TODO : Add permission
    // TODO : Change Provider to Promise
    return new Promise((resolve, reject) => {
      provider.set(path, content, (error) => {
        if (error) reject(error)
        this.syncEditor(path)
        this.emit('fileSaved', path)
        resolve(true)
      })
    })
  }

  _saveAsCopy (path, content) {
    const fileProvider = this.fileProviderOf(path)
    if (fileProvider) {
      helper.createNonClashingNameWithPrefix(path, fileProvider, '', (error, copyName) => {
        if (error) {
          copyName = path + '.' + this.currentRequest.from
        }
        this._setFileInternal(copyName, content)
        this.openFile(copyName)
      })
    }
  }

  /**
   * Try to resolve the given file path (the actual path in the file system)
   * e.g if it's specified a github link, npm library, or any external content,
   * it returns the actual path where the content can be found.
   * @param {string} file url we are trying to resolve
   * @returns {{ string, provider }} file path resolved and its provider.
   */
  getPathFromUrl (file) {
    const provider = this.fileProviderOf(file)
    if (!provider) throw new Error(`no provider for ${file}`)
    return {
      file: provider.getPathFromUrl(file) || file, // in case an external URL is given as input, we resolve it to the right internal path
      provider
    }
  }

  /**
   * Try to resolve the given file URl. opposite of getPathFromUrl
   * @param {string} file path we are trying to resolve
   * @returns {{ string, provider }} file url resolved and its provider.
   */
  getUrlFromPath (file) {
    const provider = this.fileProviderOf(file)
    if (!provider) throw new Error(`no provider for ${file}`)
    return {
      file: provider.getUrlFromPath(file) || file, // in case an external URL is given as input, we resolve it to the right internal path
      provider
    }
  }

  removeTabsOf (provider) {
    for (var tab in this.openedFiles) {
      if (this.fileProviderOf(tab).type === provider.type) {
        this.fileRemovedEvent(tab)
      }
    }
  }

  fileRemovedEvent (path) {
    if (path === this._deps.config.get('currentFile')) {
      this._deps.config.set('currentFile', '')
    }
    this.editor.discard(path)
    delete this.openedFiles[path]
    // TODO: Only keep `this.emit` (issue#2210)
    this.emit('fileRemoved', path)
    this.events.emit('fileRemoved', path)
    this.openFile()
  }

  unselectCurrentFile () {
    this.saveCurrentFile()
    this._deps.config.set('currentFile', '')
    // TODO: Only keep `this.emit` (issue#2210)
    this.emit('noFileSelected')
    this.events.emit('noFileSelected')
  }

  async openFile (file) {
    if (!file) {
      this.emit('noFileSelected')
      this.events.emit('noFileSelected')
    } else {
      this.saveCurrentFile()
      const resolved = this.getPathFromUrl(file)
      file = resolved.file
      const provider = resolved.provider
      this._deps.config.set('currentFile', file)
      this.openedFiles[file] = file
      await (() => {
        return new Promise((resolve, reject) => {
          provider.get(file, (error, content) => {
            if (error) {
              console.log(error)
              reject(error)
            } else {
              if (provider.isReadOnly(file)) {
                this.editor.openReadOnly(file, content)
              } else {
                this.editor.open(file, content)
              }
              // TODO: Only keep `this.emit` (issue#2210)
              this.emit('currentFileChanged', file)
              this.events.emit('currentFileChanged', file)
              resolve()
            }
          })
        })
      })()
    }
  }

  /**
  * Async API method getProviderOf
  * @param {string} file
  *
  */

  async getProviderOf (file) {
    const cancall = await this.askUserPermission('getProviderByName')
    if (cancall) {
      return file ? this.fileProviderOf(file) : this.currentFileProvider()
    }
  }

  /**
  * Async API method getProviderByName
  * @param {string} name
  *
  */

  async getProviderByName (name) {
    const cancall = await this.askUserPermission('getProviderByName')
    if (cancall) {
      return this.getProvider(name)
    }
  }

  getProvider (name) {
    return this._deps.filesProviders[name]
  }

  fileProviderOf (file) {
    if (file.startsWith('localhost') || this.mode === 'localhost') {
      return this._deps.filesProviders.localhost
    }
    if (file.startsWith('browser')) {
      return this._deps.filesProviders.browser
    }
    return this._deps.filesProviders.workspace
  }

  // returns the list of directories inside path
  dirList (path) {
    const dirPaths = []
    const collectList = (path) => {
      return new Promise((resolve, reject) => {
        this.readdir(path).then((ls) => {
          const promises = Object.keys(ls).map((item, index) => {
            if (ls[item].isDirectory && !dirPaths.includes(item)) {
              dirPaths.push(item)
              resolve(dirPaths)
            }
            return new Promise((resolve, reject) => { resolve() })
          })
          Promise.all(promises).then(() => { resolve(dirPaths) })
        })
      })
    }
    return collectList(path)
  }

  isRemixDActive () {
    return this.appManager.isActive('remixd')
  }

  saveCurrentFile () {
    var currentFile = this._deps.config.get('currentFile')
    if (currentFile && this.editor.current()) {
      var input = this.editor.get(currentFile)
      if ((input !== null) && (input !== undefined)) {
        var provider = this.fileProviderOf(currentFile)
        if (provider) {
          provider.set(currentFile, input)
          this.emit('fileSaved', currentFile)
        } else {
          console.log('cannot save ' + currentFile + '. Does not belong to any explorer')
        }
      }
    }
  }

  syncEditor (path) {
    var currentFile = this._deps.config.get('currentFile')
    if (path !== currentFile) return

    var provider = this.fileProviderOf(currentFile)
    if (provider) {
      provider.get(currentFile, (error, content) => {
        if (error) console.log(error)
        this.editor.setText(content)
      })
    } else {
      console.log('cannot save ' + currentFile + '. Does not belong to any explorer')
    }
  }

  setBatchFiles (filesSet, fileProvider, override, callback) {
    const self = this
    if (!fileProvider) fileProvider = 'browser'
    if (override === undefined) override = false

    async.each(Object.keys(filesSet), (file, callback) => {
      if (override) {
        try {
          self._deps.filesProviders[fileProvider].set(file, filesSet[file].content)
        } catch (e) {
          return callback(e.message || e)
        }
        self.syncEditor(fileProvider + file)
        return callback()
      }

      helper.createNonClashingName(file, self._deps.filesProviders[fileProvider],
        (error, name) => {
          if (error) {
            modalDialogCustom.alert('Unexpected error loading the file ' + error)
          } else if (helper.checkSpecialChars(name)) {
            modalDialogCustom.alert('Special characters are not allowed')
          } else {
            try {
              self._deps.filesProviders[fileProvider].set(name, filesSet[file].content)
            } catch (e) {
              return callback(e.message || e)
            }
            self.syncEditor(fileProvider + name)
          }
          callback()
        })
    }, (error) => {
      if (callback) callback(error)
    })
  }

  currentWorkspace () {
    if (this.mode !== 'localhost') {
      const file = this.currentFile() || ''
      const provider = this.fileProviderOf(file)

      return provider.workspace
    }
  }
}

module.exports = FileManager
