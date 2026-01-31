import React from 'react'
import classNames from 'classnames'
import ModalDialogView from './modal-dialog-view'
import tr from '../utils/translate'

interface ConfirmDialogViewProps {
  title?: string
  message: string
  className?: string
  yesTitle?: string
  noTitle?: string
  hideNoButton?: boolean
  callback?: () => void
  rejectCallback?: () => void
  close?: () => void
}

const ConfirmDialogView: React.FC<ConfirmDialogViewProps> = ({
  title,
  message,
  className,
  yesTitle,
  noTitle,
  hideNoButton,
  callback,
  rejectCallback,
  close
}) => {
  const confirm = () => {
    callback?.()
    close?.()
  }

  const reject = () => {
    rejectCallback?.()
    close?.()
  }

  const dialogClassName = classNames('confirm-dialog', className)

  return (
    <ModalDialogView title={title || tr('~CONFIRM_DIALOG.TITLE')} close={reject} zIndex={500}>
      <div className={dialogClassName}>
        <div className="confirm-dialog-message" dangerouslySetInnerHTML={{ __html: message }} />
        <div className="buttons">
          <button onClick={confirm}>{yesTitle || tr('~CONFIRM_DIALOG.YES')}</button>
          {!hideNoButton && (
            <button onClick={reject}>{noTitle || tr('~CONFIRM_DIALOG.NO')}</button>
          )}
        </div>
      </div>
    </ModalDialogView>
  )
}

export default ConfirmDialogView
