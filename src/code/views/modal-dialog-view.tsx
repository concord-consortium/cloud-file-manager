import React, { useRef } from "react"
import ModalView from "./modal-view"
import tr from "../utils/translate"

let idCounter = 0

interface IProps {
  title?: string
  zIndex?: number
  close?: () => void
}
const ModalDialogView: React.FC<IProps> = ({ title, zIndex = 10, close, children }) => {
  const idRef = useRef(`modal-title-${++idCounter}`)
  const titleId = idRef.current
  return (
    <ModalView zIndex={zIndex} close={close} ariaLabelledBy={titleId}>
      <div className='modal-dialog' data-testid='modal-dialog'>
        <div className='modal-dialog-wrapper'>
          <div className='modal-dialog-title' id={titleId} data-testid='modal-dialog-title'>
            {close ? <button
                className='modal-dialog-title-close icon-ex'
                data-testid='modal-dialog-close'
                aria-label={tr("~ALERT_DIALOG.CLOSE")}
                onClick={() => close?.()}
              /> : undefined}
            {title || 'Untitled Dialog'}
          </div>
          <div className='modal-dialog-workspace' data-testid='modal-dialog-workspace'>
            {children}
          </div>
        </div>
      </div>
    </ModalView>
  )
}
export default ModalDialogView
