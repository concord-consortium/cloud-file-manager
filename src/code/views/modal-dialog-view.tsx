import classNames from "classnames"
import React, { useRef } from "react"
import ModalView from "./modal-view"
import tr from "../utils/translate"

let idCounter = 0

interface IProps {
  title?: string
  titleClassName?: string
  zIndex?: number
  close?: () => void
}
const ModalDialogView: React.FC<IProps> = ({ title, titleClassName, zIndex = 10, close, children }) => {
  const idRef = useRef(`modal-title-${++idCounter}`)
  const titleId = idRef.current
  const titleClasses = classNames('modal-dialog-title', titleClassName)
  return (
    <ModalView zIndex={zIndex} close={close} ariaLabelledBy={titleId}>
      <div className='modal-dialog' data-testid='cfm-dialog-shell'>
        <div className='modal-dialog-wrapper' data-testid='cfm-dialog-wrapper'>
          <div className={titleClasses} data-testid='cfm-dialog-title'>
            <span id={titleId}>{title || 'Untitled Dialog'}</span>
            {close ? <button
                className='modal-dialog-title-close'
                data-testid='cfm-dialog-close-button'
                aria-label={tr("~ALERT_DIALOG.CLOSE")}
                onClick={() => close?.()}
              /> : undefined}
          </div>
          <div className='modal-dialog-workspace' data-testid='cfm-dialog-workspace'>
            {children}
          </div>
        </div>
      </div>
    </ModalView>
  )
}
export default ModalDialogView
