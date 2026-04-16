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

  const handleRename = () => {
    if (trimmedFilename.length > 0) {
      callback?.(trimmedFilename)
      close?.()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleRename()
    }
  }

  return (
    <ModalDialogView title={tr('~DIALOG.RENAME')} titleClassName="dialog-rename" close={close}>
      <div className="rename-dialog" data-testid="cfm-dialog-rename">
        <input
          ref={inputRef}
          data-testid="cfm-dialog-rename-filename-input"
          aria-label={tr("~FILE_DIALOG.FILENAME")}
          placeholder={tr("~FILE_DIALOG.FILENAME")}
          value={filename}
          onChange={handleFilenameChange}
          onKeyDown={handleKeyDown}
        />
        <div className="buttons">
          <button
            className="cancel"
            data-testid="cfm-dialog-rename-cancel-button"
            onClick={close}
          >
            {tr('~RENAME_DIALOG.CANCEL')}
          </button>
          <button
            className={trimmedFilename.length === 0 ? 'disabled' : undefined}
            disabled={trimmedFilename.length === 0}
            data-testid="cfm-dialog-rename-confirm-button"
            onClick={handleRename}
          >
            {tr('~RENAME_DIALOG.RENAME')}
          </button>
        </div>
      </div>
    </ModalDialogView>
  )
}

export default RenameDialogView
