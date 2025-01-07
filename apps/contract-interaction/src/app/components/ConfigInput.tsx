import React, { useEffect, useState } from 'react'
import { CustomTooltip } from '@remix-ui/helper'

interface ConfigInputProps {
  label: string
  id: string
  secret: boolean
  initialValue: string
  saveResult: (result: string) => void
}

// Chooses one contract from the compilation output.
export const ConfigInput: React.FC<ConfigInputProps> = ({ label, id, secret, initialValue, saveResult }) => {
  const [value, setValue] = useState(initialValue)
  const [enabled, setEnabled] = useState(false)

  // Reset state when initialValue changes
  useEffect(() => {
    setValue(initialValue)
    setEnabled(false)
  }, [initialValue])

  const handleChange = () => {
    setEnabled(true)
  }

  const handleSave = () => {
    setEnabled(false)
    saveResult(value)
  }

  const handleCancel = () => {
    setEnabled(false)
    setValue(initialValue)
  }

  return (
    <div className="form-group small mb-0">
      <label className='mt-3' htmlFor={id}>{label}</label>
      <div className="d-flex flex-row justify-content-start">
        <input
          type={secret ? 'password' : 'text'}
          className={`form-control small w-100 ${!enabled ? 'bg-transparent pl-0 border-0' : ''}`}
          id={id}
          placeholder={`Add ${label}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={!enabled}
        />

        { enabled ? (
          <>
            <button type="button" className="btn btn-primary btn-sm ml-2" onClick={handleSave}>
              Save
            </button>
            <button type="button" className="btn btn-secondary btn-sm ml-2" onClick={handleCancel}>
              Cancel
            </button>
          </>
        ) : (
          <CustomTooltip tooltipText={`Edit ${label}`}>
            <button type="button" className="btn btn-sm fas fa-pen my-1" style={{ height: '100%' }} disabled={enabled} onClick={handleChange}>
            </button>
          </CustomTooltip>
        )}
      </div>
    </div>
  )
}
