import React, { useRef, useEffect } from 'react'
import ModalDialogView from './modal-dialog-view'
import tr from '../utils/translate'

interface AlertDialogViewProps {
  title?: string
  message: string
  callback?: () => void
  close?: () => void
}

const AlertDialogView: React.FC<AlertDialogViewProps> = ({ title, message, callback, close }) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeButtonRef.current?.focus()
  }, [])

  const handleClose = () => {
    close?.()
    callback?.()
  }

  return (
    <ModalDialogView title={title || tr('~ALERT_DIALOG.TITLE')} close={handleClose} zIndex={500}>
      <div className="alert-dialog" data-testid="cfm-dialog-alert">
        <div
          className="alert-dialog-message"
          data-testid="cfm-dialog-alert-message"
          dangerouslySetInnerHTML={{ __html: message }}
        />
        <div className="buttons">
          <button
            ref={closeButtonRef}
            data-testid="cfm-dialog-alert-close-button"
            onClick={handleClose}
          >
            {tr('~ALERT_DIALOG.CLOSE')}
          </button>
        </div>
      </div>
    </ModalDialogView>
  )
}

export default AlertDialogView
