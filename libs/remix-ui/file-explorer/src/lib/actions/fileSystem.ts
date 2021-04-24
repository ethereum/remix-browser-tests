import React from 'react'
import { File } from '../types'
import { extractNameFromKey, extractParentFromKey } from '../utils'

export const fetchDirectoryError = (error: any) => {
  return {
    type: 'FETCH_DIRECTORY_ERROR',
    payload: error
  }
}

export const fetchDirectoryRequest = (promise: Promise<any>) => {
  return {
    type: 'FETCH_DIRECTORY_REQUEST',
    payload: promise
  }
}

export const fetchDirectorySuccess = (path: string, files: File[]) => {
  return {
    type: 'FETCH_DIRECTORY_SUCCESS',
    payload: { path, files }
  }
}

export const fileSystemReset = () => {
  return {
    type: 'FILESYSTEM_RESET'
  }
}

const normalize = (parent, filesList, newInputType?: string): any => {
  const folders = {}
  const files = {}

  Object.keys(filesList || {}).forEach(key => {
    key = key.replace(/^\/|\/$/g, '') // remove first and last slash
    let path = key
    path = path.replace(/^\/|\/$/g, '') // remove first and last slash

    if (filesList[key].isDirectory) {
      folders[extractNameFromKey(key)] = {
        path,
        name: extractNameFromKey(path),
        isDirectory: filesList[key].isDirectory
      }
    } else {
      files[extractNameFromKey(key)] = {
        path,
        name: extractNameFromKey(path),
        isDirectory: filesList[key].isDirectory
      }
    }
  })

  if (newInputType === 'folder') {
    const path = parent + '/blank'

    folders[path] = {
      path: path,
      name: '',
      isDirectory: true
    }
  } else if (newInputType === 'file') {
    const path = parent + '/blank'

    files[path] = {
      path: path,
      name: '',
      isDirectory: false
    }
  }

  return Object.assign({}, folders, files)
}

const fetchDirectoryContent = async (provider, folderPath: string, newInputType?: string): Promise<any> => {
  return new Promise((resolve) => {
    provider.resolveDirectory(folderPath, (error, fileTree) => {
      if (error) console.error(error)
      const files = normalize(folderPath, fileTree, newInputType)

      resolve({ [extractNameFromKey(folderPath)]: files })
    })
  })
}

export const fetchDirectory = (provider, path: string) => (dispatch: React.Dispatch<any>) => {
  const promise = fetchDirectoryContent(provider, path)

  dispatch(fetchDirectoryRequest(promise))
  promise.then((files) => {
    dispatch(fetchDirectorySuccess(path, files))
  }).catch((error) => {
    dispatch(fetchDirectoryError({ error }))
  })
  return promise
}

export const resolveDirectoryError = (error: any) => {
  return {
    type: 'RESOLVE_DIRECTORY_ERROR',
    payload: error
  }
}

export const resolveDirectoryRequest = (promise: Promise<any>) => {
  return {
    type: 'RESOLVE_DIRECTORY_REQUEST',
    payload: promise
  }
}

export const resolveDirectorySuccess = (path: string, files: File[]) => {
  return {
    type: 'RESOLVE_DIRECTORY_SUCCESS',
    payload: { path, files }
  }
}

export const resolveDirectory = (provider, path: string) => (dispatch: React.Dispatch<any>) => {
  const promise = fetchDirectoryContent(provider, path)

  dispatch(resolveDirectoryRequest(promise))
  promise.then((files) => {
    dispatch(resolveDirectorySuccess(path, files))
  }).catch((error) => {
    dispatch(resolveDirectoryError({ error }))
  })
  return promise
}

export const fetchProviderError = (error: any) => {
  return {
    type: 'FETCH_PROVIDER_ERROR',
    payload: error
  }
}

export const fetchProviderRequest = (promise: Promise<any>) => {
  return {
    type: 'FETCH_PROVIDER_REQUEST',
    payload: promise
  }
}

export const fetchProviderSuccess = (provider: any) => {
  return {
    type: 'FETCH_PROVIDER_SUCCESS',
    payload: provider
  }
}

export const fileAddedSuccess = (path: string, files) => {
  return {
    type: 'FILE_ADDED',
    payload: { path, files }
  }
}

export const folderAddedSuccess = (path: string, files) => {
  return {
    type: 'FOLDER_ADDED',
    payload: { path, files }
  }
}

export const fileRemovedSuccess = (path: string, removePath: string) => {
  return {
    type: 'FILE_REMOVED',
    payload: { path, removePath }
  }
}

export const setProvider = (provider, workspaceName) => (dispatch: React.Dispatch<any>) => {
  if (provider) {
    provider.event.register('fileAdded', async (filePath) => {
      const path = extractParentFromKey(filePath) || workspaceName
      const data = await fetchDirectoryContent(provider, path)

      dispatch(fileAddedSuccess(path, data))
    })
    provider.event.register('folderAdded', async (folderPath) => {
      const path = extractParentFromKey(folderPath) || workspaceName
      const data = await fetchDirectoryContent(provider, path)

      dispatch(folderAddedSuccess(path, data))
    })
    provider.event.register('fileRemoved', async (removePath) => {
      const path = extractParentFromKey(removePath) || workspaceName

      dispatch(fileRemovedSuccess(path, removePath))
    })
    provider.event.register('fileRenamed', async () => {

    })
    dispatch(fetchProviderSuccess(provider))
    dispatch(setCurrentWorkspace(workspaceName))
  } else {
    dispatch(fetchProviderError('No provider available'))
  }
}

export const setCurrentWorkspace = (name: string) => {
  return {
    type: 'SET_CURRENT_WORKSPACE',
    payload: name
  }
}

export const addInputFieldSuccess = (path: string, files: File[]) => {
  return {
    type: 'ADD_INPUT_FIELD',
    payload: { path, files }
  }
}

export const addInputField = (provider, type: string, path: string) => (dispatch: React.Dispatch<any>) => {
  const promise = fetchDirectoryContent(provider, path, type)

  promise.then((files) => {
    dispatch(addInputFieldSuccess(path, files))
  }).catch((error) => {
    console.error(error)
  })
  return promise
}

export const removeInputFieldSuccess = (path: string) => {
  return {
    type: 'REMOVE_INPUT_FIELD',
    payload: { path }
  }
}

export const removeInputField = (path: string) => (dispatch: React.Dispatch<any>) => {
  return dispatch(removeInputFieldSuccess(path))
}
