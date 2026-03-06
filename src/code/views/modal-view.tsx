import React from 'react'
import { ModalOverlay, Modal, Dialog } from 'react-aria-components'

interface IProps {
  zIndex?: number
  close?: () => void
  ariaLabel?: string
  ariaLabelledBy?: string
}

const ModalView: React.FC<IProps> = ({ zIndex, close, ariaLabel, ariaLabelledBy, children }) => {
  const overlayStyle = zIndex ? { zIndex } : undefined
  const modalStyle = zIndex ? { zIndex: zIndex + 1 } : undefined
  return (
    <ModalOverlay
      className="modal"
      isOpen={true}
      isDismissable={!!close}
      onOpenChange={(isOpen) => { if (!isOpen) close?.() }}
      style={overlayStyle}
    >
      <Modal className="modal-content" style={modalStyle}>
        <Dialog
          className="modal-dialog-container"
          aria-label={ariaLabelledBy ? undefined : (ariaLabel || "Dialog")}
          aria-labelledby={ariaLabelledBy}
        >
          {children}
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}

export default ModalView
