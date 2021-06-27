import React from "react"
import ModalView from "./modal-view"

interface IProps {
  title?: string;
  zIndex?: number;
  close?: () => void;
}
const ModalDialogView: React.FC<IProps> = ({ title, zIndex = 10, close, children }) => {
  return (
    <ModalView zIndex={zIndex} close={close}>
      <div className='modal-dialog' data-testid='modal-dialog'>
        <div className='modal-dialog-wrapper'>
          <div className='modal-dialog-title' data-testid='modal-dialog-title'>
            <i className='modal-dialog-title-close icon-ex' data-testid='modal-dialog-close'
                onClick={() => close?.()}/>
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
