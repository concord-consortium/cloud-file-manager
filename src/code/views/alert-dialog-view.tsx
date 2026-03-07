import React from 'react'
import ModalDialogView from './modal-dialog-view'
import tr from '../utils/translate'

interface AlertDialogViewProps {
  title?: string
  message: string
  callback?: () => void
  close?: () => void
}

const AlertDialogView: React.FC<AlertDialogViewProps> = ({ title, message, callback, close }) => {
  const handleClose = () => {
    close?.()
    callback?.()
  }

  return (
    <ModalDialogView title={title || tr('~ALERT_DIALOG.TITLE')} close={handleClose} zIndex={500}>
      <div className="alert-dialog">
        <div className="alert-dialog-message" dangerouslySetInnerHTML={{ __html: message }} />
        <div className="buttons">
          <button onClick={handleClose}>{tr('~ALERT_DIALOG.CLOSE')}</button>
        </div>
      </div>
    </ModalDialogView>
  )
}

export default AlertDialogView
