// eslint-disable-next-line no-use-before-define
import React, { SyntheticEvent, useEffect, useState } from 'react'
import { FileType } from '../types'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { TreeView, TreeViewItem } from '@remix-ui/tree-view'
import { getPathIcon } from '@remix-ui/helper'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FileLabel } from './file-label'
import { fileDecoration, FileDecorationIcons } from '@remix-ui/file-decorators'





export interface RenderFileProps {
  file: FileType,
  index: number,
  focusEdit: { element: string, type: string, isNew: boolean, lastEdit: string },
  focusElement: { key: string, type: 'file' | 'folder' | 'gist' }[],
  focusContext: { element: string, x: number, y: number, type: string },
  ctrlKey: boolean,
  expandPath: string[],
  editModeOff: (content: string) => void,
  handleClickFolder: (path: string, type: string) => void,
  handleClickFile: (path: string, type: string) => void,
  handleContextMenu: (pageX: number, pageY: number, path: string, content: string, type: string) => void
  fileDecorations: fileDecoration[]
}

export const FileRender = (props: RenderFileProps) => {
  const [file, setFile] = useState<FileType>({} as FileType)
  const [hover, setHover] = useState<boolean>(false)
  const [icon, setIcon] = useState<string>('')

  useEffect(() => {
    if (props.file && props.file.path && props.file.type) {
      setFile(props.file)
      setIcon(getPathIcon(props.file.path))
    }
  }, [props.file])

  const labelClass = props.focusEdit.element === file.path
    ? 'bg-light' : props.focusElement.findIndex(item => item.key === file.path) !== -1
      ? 'bg-secondary' : hover
        ? 'bg-light border' : (props.focusContext.element === file.path) && (props.focusEdit.element !== file.path)
          ? 'bg-light border' : ''

  const spreadProps = {
    onClick: (e) => e.stopPropagation()
  }

  const handleFolderClick = (event: SyntheticEvent) => {
    event.stopPropagation()
    if (props.focusEdit.element !== file.path) props.handleClickFolder(file.path, file.type)
  }

  const handleFileClick = (event: SyntheticEvent) => {
    event.stopPropagation()
    if (props.focusEdit.element !== file.path) props.handleClickFile(file.path, file.type)
  }

  const handleContextMenu = (event: PointerEvent) => {
    event.preventDefault()
    event.stopPropagation()
    props.handleContextMenu(event.pageX, event.pageY, file.path, (event.target as HTMLElement).textContent, file.type)
  }

  const handleMouseOut = (event: SyntheticEvent) => {
    event.stopPropagation()
    setHover(false)
  }

  const handleMouseOver = (event: SyntheticEvent) => {
    event.stopPropagation()
    setHover(true)
  }

  if (file.isDirectory) {
    return (
      <TreeViewItem
        id={`treeViewItem${file.path}`}
        iconX='pr-3 fa fa-folder'
        iconY='pr-3 fa fa-folder-open'
        key={`${file.path + props.index}`}
        label={<FileLabel fileDecorations={props.fileDecorations} file={file} focusEdit={props.focusEdit} editModeOff={props.editModeOff} />}
        onClick={handleFolderClick}
        onContextMenu={handleContextMenu}
        labelClass={labelClass}
        controlBehaviour={ props.ctrlKey }
        expand={props.expandPath.includes(file.path)}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
        expandedPaths={props.expandPath}
      >
        {
          file.child ? <TreeView id={`treeView${file.path}`} key={`treeView${file.path}`} {...spreadProps }>{
            Object.keys(file.child).map((key, index) => <FileRender
              file={file.child[key]}
              fileDecorations={props.fileDecorations}
              index={index}
              focusContext={props.focusContext}
              focusEdit={props.focusEdit}
              focusElement={props.focusElement}
              ctrlKey={props.ctrlKey}
              editModeOff={props.editModeOff}
              handleClickFile={props.handleClickFile}
              handleClickFolder={props.handleClickFolder}
              handleContextMenu={props.handleContextMenu}
              expandPath={props.expandPath}
              key={index}
            />)
          }
          </TreeView> : <TreeView id={`treeView${file.path}`} key={`treeView${file.path}`} {...spreadProps }/>
        }
      </TreeViewItem>
    )
  } else {
    return (
      <TreeViewItem
        id={`treeViewItem${file.path}`}
        key={`treeView${file.path}`}
        label={
          <>
            <div className="d-flex flex-row">
              <FileLabel file={file} fileDecorations={props.fileDecorations} focusEdit={props.focusEdit} editModeOff={props.editModeOff} />
              <FileDecorationIcons file={file} fileDecorations={props.fileDecorations}/>
            </div>
          </>
        }
        onClick={handleFileClick}
        onContextMenu={handleContextMenu}
        icon={icon}
        labelClass={labelClass}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
        expandedPaths={props.expandPath}
      />
    )
  }
}
