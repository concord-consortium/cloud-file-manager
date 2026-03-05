import React, { useState, useRef, useEffect } from 'react'
import ModalDialogView from './modal-dialog-view'
import tr from '../utils/translate'

interface RenameDialogViewProps {
  filename?: string
  callback?: (filename: string) => void
  close?: () => void
}

const RenameDialogView: React.FC<RenameDialogViewProps> = ({ filename: initialFilename = '', callback, close }) => {
  const [filename, setFilename] = useState(initialFilename)
  const inputRef = useRef<HTMLInputElement>(null)

  const trimmedFilename = filename.replace(/^\s+|\s+$/, '')

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleFilenameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilename(e.target.value)
  }

  const handleRename = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (trimmedFilename.length > 0) {
      callback?.(filename)
      close?.()
    } else {
      e.preventDefault()
      inputRef.current?.focus()
    }
  }

  return (
    <ModalDialogView title={tr('~DIALOG.RENAME')} close={close}>
      <div className="rename-dialog">
        <input
          ref={inputRef}
          placeholder="Filename"
          value={filename}
          onChange={handleFilenameChange}
        />
        <div className="buttons">
          <button
            className={trimmedFilename.length === 0 ? 'disabled' : ''}
            onClick={handleRename}
          >
            {tr('~RENAME_DIALOG.RENAME')}
          </button>
          <button onClick={close}>{tr('~RENAME_DIALOG.CANCEL')}</button>
        </div>
      </div>
    </ModalDialogView>
  )
}

export default RenameDialogView
