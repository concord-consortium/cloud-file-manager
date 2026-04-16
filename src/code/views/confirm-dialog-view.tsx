import React, { useRef, useEffect } from 'react'
import classNames from 'classnames'
import ModalDialogView from './modal-dialog-view'
import tr from '../utils/translate'
import { sanitizeMenuItemKey } from '../utils/testids'

interface ConfirmDialogViewProps {
  title?: string
  message: string
  /** For CSS styling only. Use `confirmKind` for test selection — see specs/CFM-15-add-missing-data-test-id-values.md. */
  className?: string
  yesTitle?: string
  noTitle?: string
  hideNoButton?: boolean
  confirmKind?: string
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
  confirmKind,
  callback,
  rejectCallback,
  close
}) => {
  const noButtonRef = useRef<HTMLButtonElement>(null)
  const yesButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    // Focus the "No"/reject button by default (safer action), or "Yes" if No is hidden
    const focusTarget = hideNoButton ? yesButtonRef.current : noButtonRef.current
    focusTarget?.focus()
  }, [hideNoButton])

  const confirm = () => {
    callback?.()
    close?.()
  }

  const reject = () => {
    rejectCallback?.()
    close?.()
  }

  const dialogClassName = classNames('confirm-dialog', className)
  const confirmKindName = confirmKind ? sanitizeMenuItemKey(confirmKind) : ''
  const confirmWrapperTestId = confirmKindName
    ? `cfm-dialog-confirm-${confirmKindName}`
    : 'cfm-dialog-confirm'

  return (
    <ModalDialogView title={title || tr('~CONFIRM_DIALOG.TITLE')} close={reject} zIndex={500}>
      <div className={dialogClassName} data-testid={confirmWrapperTestId}>
        <div
          className="confirm-dialog-message"
          data-testid="cfm-dialog-confirm-message"
          dangerouslySetInnerHTML={{ __html: message }}
        />
        <div className="buttons">
          <button
            ref={yesButtonRef}
            data-testid="cfm-dialog-confirm-yes-button"
            onClick={confirm}
          >
            {yesTitle || tr('~CONFIRM_DIALOG.YES')}
          </button>
          {!hideNoButton && (
            <button
              ref={noButtonRef}
              data-testid="cfm-dialog-confirm-no-button"
              onClick={reject}
            >
              {noTitle || tr('~CONFIRM_DIALOG.NO')}
            </button>
          )}
        </div>
      </div>
    </ModalDialogView>
  )
}

export default ConfirmDialogView
