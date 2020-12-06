import React, { useEffect, useState, useRef } from 'react' // eslint-disable-line
import { TreeView, TreeViewItem } from '@remix-ui/tree-view' // eslint-disable-line
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd' // eslint-disable-line
import { FileExplorerMenu } from './file-explorer-menu' // eslint-disable-line
import { FileExplorerProps, File } from './types'
import * as helper from '../../../../../apps/remix-ide/src/lib/helper'

import './css/file-explorer.css'

export const FileExplorer = (props: FileExplorerProps) => {
  const { files, name, registry, plugin } = props
  const containerRef = useRef(null)
  const contextMenuRef = useRef({})
  const [state, setState] = useState({
    focusElement: [],
    focusPath: null,
    files: [],
    fileManager: null,
    accessToken: null,
    ctrlKey: false,
    newFileName: '',
    actions: [],
    focusContext: {
      element: null,
      x: null,
      y: null
    }
  })

  useEffect(() => {
    (async () => {
      const fileManager = registry.get('filemanager').api
      const config = registry.get('config').api
      const accessToken = config.get('settings/gist-access-token')
      const files = await fetchDirectoryContent(name)
      const actions = [{
        name: 'New File',
        type: ['folder']
      }, {
        name: 'New Folder',
        type: ['folder']
      }, {
        name: 'Rename',
        type: ['file', 'folder']
      }, {
        name: 'Delete',
        type: ['file', 'folder']
      }, {
        name: 'Push changes to gist',
        type: []
      }]

      setState(prevState => {
        return { ...prevState, fileManager, accessToken, files, actions }
      })
    })()
  }, [])

  const resolveDirectory = async (folderPath, dir: File[]): Promise<File[]> => {
    dir = await Promise.all(dir.map(async (file) => {
      if (file.path === folderPath) {
        file.child = await fetchDirectoryContent(folderPath)
        return file
      } else if (file.child) {
        file.child = await resolveDirectory(folderPath, file.child)
        return file
      } else {
        return file
      }
    }))

    return dir
  }

  const fetchDirectoryContent = async (folderPath: string): Promise<File[]> => {
    return new Promise((resolve) => {
      files.resolveDirectory(folderPath, (error, fileTree) => {
        if (error) console.error(error)
        const files = normalize(folderPath, fileTree)

        resolve(files)
      })
    })
  }

  const normalize = (path, filesList): File[] => {
    const folders = []
    const files = []
    const prefix = path.split('/')[0]

    Object.keys(filesList).forEach(key => {
      const path = prefix + '/' + key

      if (filesList[key].isDirectory) {
        folders.push({
          path,
          name: extractNameFromKey(path),
          isDirectory: filesList[key].isDirectory
        })
      } else {
        files.push({
          path,
          name: extractNameFromKey(path),
          isDirectory: filesList[key].isDirectory
        })
      }
    })

    return [...folders, ...files]
  }

  const extractNameFromKey = (key: string):string => {
    const keyPath = key.split('/')

    return keyPath[keyPath.length - 1]
  }

  const extractParentFromKey = (key: string):string => {
    const keyPath = key.split('/')

    return keyPath.pop()
  }

  const createNewFile = (parentFolder?: string) => {
    if (!parentFolder) parentFolder = extractParentFromKey(state.focusElement[0])
    // const self = this
    // modalDialogCustom.prompt('Create new file', 'File Name (e.g Untitled.sol)', 'Untitled.sol', (input) => {
    // if (!input) input = 'New file'
    const fileManager = state.fileManager
    const newFileName = parentFolder + '/' + 'unnamed' + Math.floor(Math.random() * 101) // get filename from state (state.newFileName)

    helper.createNonClashingName(newFileName, props.files, async (error, newName) => {
      // if (error) return tooltip('Failed to create file ' + newName + ' ' + error)
      if (error) return
      const createFile = await fileManager.writeFile(newName, '')

      if (!createFile) {
        // tooltip('Failed to create file ' + newName)
      } else {
        addFile(parentFolder, newFileName)
        await fileManager.open(newName)
      }
    })
    // }, null, true)
  }

  const addFile = async (parentFolder: string, newFileName: string) => {
    if (parentFolder === name) {
      setState(prevState => {
        return {
          ...prevState,
          files: [...prevState.files, {
            path: newFileName,
            name: extractNameFromKey(newFileName),
            isDirectory: false
          }],
          focusElement: [newFileName]
        }
      })
    } else {
      const updatedFiles = await resolveDirectory(parentFolder, state.files)

      setState(prevState => {
        return { ...prevState, files: updatedFiles, focusElement: [newFileName] }
      })
    }
    if (newFileName.includes('_test.sol')) {
      plugin.events.trigger('newTestFileCreated', [newFileName])
    }
  }

  // self._components = {}
  // self._components.registry = localRegistry || globalRegistry
  // self._deps = {
  //   config: self._components.registry.get('config').api,
  //   editor: self._components.registry.get('editor').api,
  //   fileManager: self._components.registry.get('filemanager').api
  // }

  // self._components.registry.put({ api: self, name: `fileexplorer/${self.files.type}` })

  // warn if file changed outside of Remix
  // function remixdDialog () {
  //   return yo`<div>This file has been changed outside of Remix IDE.</div>`
  // }

  // props.files.event.register('fileExternallyChanged', (path, file) => {
  //   if (self._deps.config.get('currentFile') === path && self._deps.editor.currentContent() && self._deps.editor.currentContent() !== file.content) {
  //     if (this.files.isReadOnly(path)) return self._deps.editor.setText(file.content)

  //     modalDialog(path + ' changed', remixdDialog(),
  //       {
  //         label: 'Replace by the new content',
  //         fn: () => {
  //           self._deps.editor.setText(file.content)
  //         }
  //       },
  //       {
  //         label: 'Keep the content displayed in Remix',
  //         fn: () => {}
  //       }
  //     )
  //   }
  // })

  // register to event of the file provider
  // files.event.register('fileRemoved', fileRemoved)
  // files.event.register('fileRenamed', fileRenamed)
  // files.event.register('fileRenamedError', fileRenamedError)
  // files.event.register('fileAdded', fileAdded)
  // files.event.register('folderAdded', folderAdded)

  // function fileRenamedError (error) {
  //   modalDialogCustom.alert(error)
  // }

  // const fileAdded = (filepath) => {
  //   const folderpath = filepath.split('/').slice(0, -1).join('/')
  // const currentTree = self.treeView.nodeAt(folderpath)
  // if (!self.treeView.isExpanded(folderpath)) self.treeView.expand(folderpath)
  // if (currentTree) {
  //   props.files.resolveDirectory(folderpath, (error, fileTree) => {
  //     if (error) console.error(error)
  //     if (!fileTree) return
  //     fileTree = normalize(folderpath, fileTree)
  //     self.treeView.updateNodeFromJSON(folderpath, fileTree, true)
  //     self.focusElement = self.treeView.labelAt(self.focusPath)
  //     // TODO: here we update the selected file (it applicable)
  //     // cause we are refreshing the interface of the whole directory when there's a new file.
  //     if (self.focusElement && !self.focusElement.classList.contains('bg-secondary')) {
  //       self.focusElement.classList.add('bg-secondary')
  //     }
  //   })
  // }
  // }

  const label = (data: File) => {
    return (
      <div className='remixui_items'>
        <span
          title={data.path}
          className={'remixui_label ' + (data.isDirectory ? 'folder' : 'remixui_leaf')}
          data-path={data.path}
          // onkeydown=${editModeOff}
          // onblur=${editModeOff}
        >
          { data.path.split('/').pop() }
        </span>
      </div>
    )
  }

  const contextMenu = (actions: { name: string, type: string[] }[], index: number) => {
    const menu = actions.map((item) => {
      return <li
        id={`menuitem${item.name.toLowerCase()}`}
        className='remixui_liitem'
        onClick={() => {
          if (item.name === 'Create File') {
            createNewFile()
          }
          setState(prevState => {
            return { ...prevState, focusContext: { element: null, x: null, y: null } }
          })
        }}>{item.name}</li>
    })

    return (
      <div
        id="menuItemsContainer"
        className="p-1 remixui_container bg-light shadow border"
        style={{ left: state.focusContext.x, top: state.focusContext.y }}
        ref={ref => { contextMenuRef.current[index] = ref }}
      >
        <ul id='menuitems'>{menu}</ul>
      </div>
    )
  }

  const onDragEnd = result => {

  }

  const handleClickFile = (path) => {
    state.fileManager.open(path)
    setState(prevState => {
      return { ...prevState, focusElement: [path] }
    })
  }

  const handleClickFolder = async (path) => {
    if (state.ctrlKey) {
      if (state.focusElement.findIndex(item => item === path) !== -1) {
        setState(prevState => {
          return { ...prevState, focusElement: [...prevState.focusElement.filter(item => item !== path)] }
        })
      } else {
        setState(prevState => {
          return { ...prevState, focusElement: [...prevState.focusElement, path] }
        })
      }
    } else {
      const files = await resolveDirectory(path, state.files)

      setState(prevState => {
        return { ...prevState, focusElement: [path], files }
      })
    }
  }

  const handleContextMenuFile = (pageX, pageY, label) => {
    const menuItemsContainer = contextMenuRef.current
    const boundary = menuItemsContainer.getBoundingClientRect()

    if (boundary.bottom > (window.innerHeight || document.documentElement.clientHeight)) {
      menuItemsContainer.style.position = 'absolute'
      menuItemsContainer.style.bottom = '10px'
      menuItemsContainer.style.top = null
    }
  }

  const renderFiles = (file: File, index: number) => {
    if (file.isDirectory) {
      return (
        <Droppable droppableId={file.path} key={index}>
          {(provided) => (
            <TreeViewItem
              { ...provided.droppableProps }
              innerRef={ provided.innerRef }
              id={`treeViewItem${file.path}`}
              iconX='pr-3 far fa-folder'
              iconY='pr-3 far fa-folder-open'
              key={`${file.path + index}`}
              label={label(file)}
              onClick={(e) => {
                e.stopPropagation()
                handleClickFolder(file.path)
              }}
              labelClass={ state.focusElement.findIndex(item => item === file.path) !== -1 ? 'bg-secondary' : '' }
              controlBehaviour={ state.ctrlKey }
              onContextMenu={(e) => {
                e.preventDefault()
              }}
            >
              {
                file.child ? <TreeView id={`treeView${file.path}`} key={index}>{
                  file.child.map((file, index) => {
                    return renderFiles(file, index)
                  })
                }
                </TreeView> : <TreeView id={`treeView${file.path}`} key={index} />
              }
              { provided.placeholder }
            </TreeViewItem>
          )}
        </Droppable>
      )
    } else {
      return (
        <Draggable draggableId={file.path} index={index} key={index}>
          {(provided) => (
            <>
              <TreeViewItem
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                innerRef={provided.innerRef}
                id={`treeViewItem${file.path}`}
                key={index}
                label={label(file)}
                onClick={(e) => {
                  e.stopPropagation()
                  handleClickFile(file.path)
                }}
                onContextMenu={(e) => {
                  e.preventDefault()
                  handleContextMenuFile()
                }}
                icon='fa fa-file'
                labelClass={ state.focusElement.findIndex(item => item === file.path) !== -1 ? 'bg-secondary' : '' }
              />
              { contextMenu(state.actions.filter(item => item.type.findIndex(name => name === 'file') !== -1), index) }
            </>
          )}
        </Draggable>
      )
    }
  }

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.shiftKey) {
          setState(prevState => {
            return { ...prevState, ctrlKey: true }
          })
        }
      }}
      onKeyUp={() => {
        setState(prevState => {
          return { ...prevState, ctrlKey: false }
        })
      }}
    >
      <TreeView id='treeView'>
        <TreeViewItem id="treeViewItem"
          label={
            <FileExplorerMenu
              title={name}
              menuItems={props.menuItems}
              addFile={addFile}
              createNewFile={createNewFile}
              files={props.files}
              fileManager={state.fileManager}
              accessToken={state.accessToken}
            />
          }
          expand={true}>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId='droppableTreeView'>
              {(provided) => (
                <div
                  { ...provided.droppableProps }
                  ref={ provided.innerRef }>
                  <TreeView id='treeViewMenu'>
                    {
                      state.files.map((file, index) => {
                        return renderFiles(file, index)
                      })
                    }
                  </TreeView>
                  { provided.placeholder }
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </TreeViewItem>
      </TreeView>
    </div>
  )
}

export default FileExplorer
