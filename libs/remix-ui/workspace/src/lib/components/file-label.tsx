// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useEffect, useRef, useState } from 'react'
import { FileType } from '../types'

export interface FileLabelProps {
  file: FileType,
  focusEdit: {
    element: string
    type: string
    isNew: boolean
    lastEdit: string
  }
  editModeOff: (content: string) => void
}

export const FileLabel = (props: FileLabelProps) => {
  const { file, focusEdit, editModeOff } = props
  const [isEditable, setIsEditable] = useState<boolean>(false)
  const labelRef = useRef(null)
  const [defaultValue, setDefaultValue] = useState<string>(null)

  useEffect(() => {
    if (focusEdit.element && file.path) {
      setIsEditable(focusEdit.element === file.path)
    }
  }, [file.path, focusEdit])

  useEffect(() => {
    if (labelRef.current) {
      setTimeout(() => {
        labelRef.current.focus()
      }, 0)
    }
  }, [isEditable])

  useEffect(() => {
    if (labelRef.current) setDefaultValue(labelRef.current.innerText)
  }, [labelRef.current])

  const handleEditInput = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.which === 13) {
      event.preventDefault()
      editModeOff(labelRef.current.innerText)
      labelRef.current.innerText = defaultValue
    }
  }

  const handleEditBlur = (event: React.SyntheticEvent) => {
    event.stopPropagation()
    editModeOff(labelRef.current.innerText)
    labelRef.current.innerText = defaultValue
  }

  return (
    <div
      className='remixui_items d-inline-block w-100'
      ref={isEditable ? labelRef : null}
      suppressContentEditableWarning={true}
      contentEditable={isEditable}
      onKeyDown={handleEditInput}
      onBlur={handleEditBlur}
    >
      <span
        title={file.path}
        className={'remixui_label ' + (file.isDirectory ? 'folder' : 'remixui_leaf')}
        data-path={file.path}
      >
        { file.name }
      </span>
    </div>
  )
}
