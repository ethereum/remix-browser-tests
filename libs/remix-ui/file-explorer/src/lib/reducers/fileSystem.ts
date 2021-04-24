import * as _ from 'lodash'
import { extractNameFromKey } from '../utils'
interface Action {
    type: string;
    payload: Record<string, any>;
}

export const fileSystemInitialState = {
  files: {
    files: [],
    workspaceName: null,
    blankPath: null,
    isRequesting: false,
    isSuccessful: false,
    error: null
  },
  provider: {
    provider: null,
    isRequesting: false,
    isSuccessful: false,
    error: null
  }
}

export const fileSystemReducer = (state = fileSystemInitialState, action: Action) => {
  switch (action.type) {
    case 'FETCH_DIRECTORY_REQUEST': {
      return {
        ...state,
        files: {
          ...state.files,
          isRequesting: true,
          isSuccessful: false,
          error: null
        }
      }
    }
    case 'FETCH_DIRECTORY_SUCCESS': {
      return {
        ...state,
        files: {
          ...state.files,
          files: action.payload.files,
          isRequesting: false,
          isSuccessful: true,
          error: null
        }
      }
    }
    case 'FETCH_DIRECTORY_ERROR': {
      return {
        ...state,
        files: {
          ...state.files,
          isRequesting: false,
          isSuccessful: false,
          error: action.payload
        }
      }
    }
    case 'RESOLVE_DIRECTORY_REQUEST': {
      return {
        ...state,
        files: {
          ...state.files,
          isRequesting: true,
          isSuccessful: false,
          error: null
        }
      }
    }
    case 'RESOLVE_DIRECTORY_SUCCESS': {
      return {
        ...state,
        files: {
          ...state.files,
          files: resolveDirectory(state.files.workspaceName, action.payload.path, state.files.files, action.payload.files),
          isRequesting: false,
          isSuccessful: true,
          error: null
        }
      }
    }
    case 'RESOLVE_DIRECTORY_ERROR': {
      return {
        ...state,
        files: {
          ...state.files,
          isRequesting: false,
          isSuccessful: false,
          error: action.payload
        }
      }
    }
    case 'FETCH_PROVIDER_REQUEST': {
      return {
        ...state,
        provider: {
          ...state.provider,
          isRequesting: true,
          isSuccessful: false,
          error: null
        }
      }
    }
    case 'FETCH_PROVIDER_SUCCESS': {
      return {
        ...state,
        provider: {
          ...state.provider,
          provider: action.payload,
          isRequesting: false,
          isSuccessful: true,
          error: null
        }
      }
    }
    case 'FETCH_PROVIDER_ERROR': {
      return {
        ...state,
        provider: {
          ...state.provider,
          isRequesting: false,
          isSuccessful: false,
          error: action.payload
        }
      }
    }
    case 'SET_CURRENT_WORKSPACE': {
      return {
        ...state,
        files: {
          ...state.files,
          workspaceName: action.payload
        }
      }
    }
    case 'ADD_INPUT_FIELD': {
      return {
        ...state,
        files: {
          ...state.files,
          files: addInputField(state.files.workspaceName, action.payload.path, state.files.files, action.payload.files),
          blankPath: action.payload.path,
          isRequesting: false,
          isSuccessful: true,
          error: null
        }
      }
    }
    case 'REMOVE_INPUT_FIELD': {
      return {
        ...state,
        files: {
          ...state.files,
          files: removeInputField(state.files.workspaceName, state.files.blankPath, state.files.files),
          blankPath: null,
          isRequesting: false,
          isSuccessful: true,
          error: null
        }
      }
    }
    case 'FILE_ADDED': {
      return {
        ...state,
        files: {
          ...state.files,
          files: fileAdded(state.files.workspaceName, action.payload.path, state.files.files, action.payload.files),
          isRequesting: false,
          isSuccessful: true,
          error: null
        }
      }
    }
    case 'FOLDER_ADDED': {
      return {
        ...state,
        files: {
          ...state.files,
          files: folderAdded(state.files.workspaceName, action.payload.path, state.files.files, action.payload.files),
          isRequesting: false,
          isSuccessful: true,
          error: null
        }
      }
    }
    case 'FILE_REMOVED': {
      return {
        ...state,
        files: {
          ...state.files,
          files: fileRemoved(state.files.workspaceName, action.payload.path, action.payload.removePath, state.files.files),
          isRequesting: false,
          isSuccessful: true,
          error: null
        }
      }
    }
    default:
      throw new Error()
  }
}

const resolveDirectory = (root, path: string, files, content) => {
  if (path === root) return { [root]: { ...content[root], ...files[root] } }
  const pathArr: string[] = path.split('/').filter(value => value)

  if (pathArr[0] !== root) pathArr.unshift(root)
  const _path = pathArr.map((key, index) => index > 1 ? ['child', key] : key).reduce((acc: string[], cur) => {
    return Array.isArray(cur) ? [...acc, ...cur] : [...acc, cur]
  }, [])

  const prevFiles = _.get(files, _path)

  files = _.set(files, _path, {
    isDirectory: true,
    path,
    name: extractNameFromKey(path),
    child: { ...content[pathArr[pathArr.length - 1]], ...prevFiles.child }
  })

  return files
}

const removePath = (root, path: string, pathName, files) => {
  const pathArr: string[] = path.split('/').filter(value => value)

  if (pathArr[0] !== root) pathArr.unshift(root)
  const _path = pathArr.map((key, index) => index > 1 ? ['child', key] : key).reduce((acc: string[], cur) => {
    return Array.isArray(cur) ? [...acc, ...cur] : [...acc, cur]
  }, [])
  const prevFiles = _.get(files, _path)

  pathName && delete prevFiles.child[pathName]
  files = _.set(files, _path, {
    isDirectory: true,
    path,
    name: extractNameFromKey(path),
    child: prevFiles.child
  })

  return files
}

const addInputField = (root, path: string, files, content) => {
  if (path === root) return { [root]: { ...content[root], ...files[root] } }
  const result = resolveDirectory(root, path, files, content)

  return result
}

const removeInputField = (root, path: string, files) => {
  if (path === root) {
    delete files[root][path + '/' + 'blank']
    return files
  }
  return removePath(root, path, path + '/' + 'blank', files)
}

const fileAdded = (root, path: string, files, content) => {
  return resolveDirectory(root, path, files, content)
}

const folderAdded = (root, path: string, files, content) => {
  return resolveDirectory(root, path, files, content)
}

const fileRemoved = (root, path: string, removedPath: string, files) => {
  if (path === root) {
    delete files[root][removedPath]

    return files
  }
  return removePath(root, path, extractNameFromKey(removedPath), files)
}
