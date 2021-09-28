import { bufferToHex, keccakFromString } from 'ethereumjs-util'
import axios, { AxiosResponse } from 'axios'
import { addInputFieldSuccess, createWorkspaceError, createWorkspaceRequest, createWorkspaceSuccess, displayNotification, fetchWorkspaceDirectoryError, fetchWorkspaceDirectoryRequest, fetchWorkspaceDirectorySuccess, hideNotification, setCurrentWorkspace, setMode, setReadOnlyMode, setRenameWorkspace } from './payload'
import { checkSlash, checkSpecialChars } from '@remix-ui/helper'

const examples = require('../../../../../../apps/remix-ide/src/app/editor/examples')
const QueryParams = require('../../../../../../apps/remix-ide/src/lib/query-params')

const LOCALHOST = ' - connect to localhost - '
const NO_WORKSPACE = ' - none - '
const queryParams = new QueryParams()
let plugin, dispatch: React.Dispatch<any>

export const setPlugin = (filePanelPlugin, reducerDispatch) => {
  plugin = filePanelPlugin
  dispatch = reducerDispatch
}

export const addInputField = async (type: 'file' | 'folder', path: string) => {
  const provider = plugin.fileManager.currentFileProvider()
  const promise = new Promise((resolve) => {
    provider.resolveDirectory(path, (error, fileTree) => {
      if (error) console.error(error)

      resolve(fileTree)
    })
  })

  promise.then((files) => {
    dispatch(addInputFieldSuccess(path, files, type))
  }).catch((error) => {
    console.error(error)
  })
  return promise
}

export const createWorkspace = async (workspaceName: string) => {
  await plugin.fileManager.closeAllFiles()
  const promise = createWorkspaceTemplate(workspaceName, 'default-template')

  dispatch(createWorkspaceRequest(promise))
  promise.then(async () => {
    dispatch(createWorkspaceSuccess(workspaceName))
    await loadWorkspacePreset('default-template')
    // await switchToWorkspace(workspaceName)
  }).catch((error) => {
    dispatch(createWorkspaceError({ error }))
  })
  return promise
}

export const createWorkspaceTemplate = async (workspaceName: string, template: 'gist-template' | 'code-template' | 'default-template' = 'default-template') => {
  if (!workspaceName) throw new Error('workspace name cannot be empty')
  if (checkSpecialChars(workspaceName) || checkSlash(workspaceName)) throw new Error('special characters are not allowed')
  if (await workspaceExists(workspaceName) && template === 'default-template') throw new Error('workspace already exists')
  else {
    const workspaceProvider = plugin.fileProviders.workspace

    await workspaceProvider.createWorkspace(workspaceName)
  }
}

export const loadWorkspacePreset = async (template: 'gist-template' | 'code-template' | 'default-template' = 'default-template') => {
  const workspaceProvider = plugin.fileProviders.workspace
  const params = queryParams.get()

  switch (template) {
    case 'code-template':
      // creates a new workspace code-sample and loads code from url params.
      try {
        let path = ''; let content = ''

        if (params.code) {
          const hash = bufferToHex(keccakFromString(params.code))

          path = 'contract-' + hash.replace('0x', '').substring(0, 10) + '.sol'
          content = atob(params.code)
          await workspaceProvider.set(path, content)
        } else if (params.url) {
          const data = await plugin.call('contentImport', 'resolve', params.url)

          path = data.cleanUrl
          content = data.content
          await workspaceProvider.set(path, content)
        }
        await plugin.fileManager.openFile(path)
      } catch (e) {
        console.error(e)
      }
      break

    case 'gist-template':
      // creates a new workspace gist-sample and get the file from gist
      try {
        const gistId = params.gist
        const response: AxiosResponse = await axios.get(`https://api.github.com/gists/${gistId}`)
        const data = response.data

        if (!data.files) {
          return dispatch(displayNotification('Gist load error', 'No files found', 'OK', null, () => { dispatch(hideNotification()) }, null))
        }
        const obj = {}

        Object.keys(data.files).forEach((element) => {
          const path = element.replace(/\.\.\./g, '/')

          obj['/' + 'gist-' + gistId + '/' + path] = data.files[element]
        })
        plugin.fileManager.setBatchFiles(obj, 'workspace', true, (errorLoadingFile) => {
          if (!errorLoadingFile) {
            const provider = plugin.fileManager.getProvider('workspace')

            provider.lastLoadedGistId = gistId
          } else {
            dispatch(displayNotification('', errorLoadingFile.message || errorLoadingFile, 'OK', null, () => {}, null))
          }
        })
      } catch (e) {
        dispatch(displayNotification('Gist load error', e.message, 'OK', null, () => { dispatch(hideNotification()) }, null))
        console.error(e)
      }
      break

    case 'default-template':
      // creates a new workspace and populates it with default project template.
      // insert example contracts
      for (const file in examples) {
        try {
          await workspaceProvider.set(examples[file].name, examples[file].content)
        } catch (error) {
          console.error(error)
        }
      }
      break
  }
}

export const workspaceExists = async (name: string) => {
  const workspaceProvider = plugin.fileProviders.workspace
  const browserProvider = plugin.fileProviders.browser
  const workspacePath = 'browser/' + workspaceProvider.workspacesPath + '/' + name

  return browserProvider.exists(workspacePath)
}

export const fetchWorkspaceDirectory = async (path: string) => {
  const provider = plugin.fileManager.currentFileProvider()
  const promise = new Promise((resolve) => {
    provider.resolveDirectory(path, (error, fileTree) => {
      if (error) console.error(error)

      resolve(fileTree)
    })
  })

  dispatch(fetchWorkspaceDirectoryRequest(promise))
  promise.then((fileTree) => {
    dispatch(fetchWorkspaceDirectorySuccess(path, fileTree))
  }).catch((error) => {
    dispatch(fetchWorkspaceDirectoryError({ error }))
  })
  return promise
}

export const renameWorkspace = async (oldName: string, workspaceName: string) => {
  await renameWorkspaceFromProvider(oldName, workspaceName)
  await dispatch(setRenameWorkspace(oldName, workspaceName))
}

export const renameWorkspaceFromProvider = async (oldName: string, workspaceName: string) => {
  if (!workspaceName) throw new Error('name cannot be empty')
  if (checkSpecialChars(workspaceName) || checkSlash(workspaceName)) throw new Error('special characters are not allowed')
  if (await workspaceExists(workspaceName)) throw new Error('workspace already exists')
  const browserProvider = plugin.fileProviders.browser
  const workspaceProvider = plugin.fileProviders.workspace
  const workspacesPath = workspaceProvider.workspacesPath
  browserProvider.rename('browser/' + workspacesPath + '/' + oldName, 'browser/' + workspacesPath + '/' + workspaceName, true)
  workspaceProvider.setWorkspace(workspaceName)
  plugin.emit('renameWorkspace', { name: workspaceName })
}

export const switchToWorkspace = async (name: string) => {
  await plugin.fileManager.closeAllFiles()
  if (name === LOCALHOST) {
    const isActive = await plugin.call('manager', 'isActive', 'remixd')

    if (!isActive) await plugin.call('manager', 'activatePlugin', 'remixd')
    dispatch(setMode('localhost'))
    plugin.emit('setWorkspace', { name: LOCALHOST, isLocalhost: true })
  } else if (name === NO_WORKSPACE) {
    plugin.fileProviders.workspace.clearWorkspace()
    dispatch(setCurrentWorkspace(null))
  } else {
    const isActive = await plugin.call('manager', 'isActive', 'remixd')

    if (isActive) plugin.call('manager', 'deactivatePlugin', 'remixd')
    await plugin.fileProviders.workspace.setWorkspace(name)
    dispatch(setMode('browser'))
    dispatch(setCurrentWorkspace(name))
    dispatch(setReadOnlyMode(false))
    plugin.emit('setWorkspace', { name, isLocalhost: false })
  }
}

export const uploadFile = async (target, targetFolder: string) => {
  // TODO The file explorer is merely a view on the current state of
  // the files module. Please ask the user here if they want to overwrite
  // a file and then just use `files.add`. The file explorer will
  // pick that up via the 'fileAdded' event from the files module.
  [...target.files].forEach((file) => {
    const workspaceProvider = plugin.fileProviders.workspace
    const loadFile = (name: string): void => {
      const fileReader = new FileReader()

      fileReader.onload = async function (event) {
        if (checkSpecialChars(file.name)) {
          dispatch(displayNotification('File Upload Failed', 'Special characters are not allowed', 'Close', null, async () => {}))
          return
        }
        const success = await workspaceProvider.set(name, event.target.result)

        if (!success) {
          return dispatch(displayNotification('File Upload Failed', 'Failed to create file ' + name, 'Close', null, async () => {}))
        }
        const config = plugin.registry.get('config').api
        const editor = plugin.registry.get('editor').api

        if ((config.get('currentFile') === name) && (editor.currentContent() !== event.target.result)) {
          editor.setText(event.target.result)
        }
      }
      fileReader.readAsText(file)
    }
    const name = `${targetFolder}/${file.name}`

    workspaceProvider.exists(name).then(exist => {
      if (!exist) {
        loadFile(name)
      } else {
        dispatch(displayNotification('Confirm overwrite', `The file ${name} already exists! Would you like to overwrite it?`, 'OK', null, () => {
          loadFile(name)
        }, () => {}))
      }
    }).catch(error => {
      if (error) console.log(error)
    })
  })
}
