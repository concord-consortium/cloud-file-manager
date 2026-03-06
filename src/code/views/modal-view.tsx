import React from 'react'
import { ModalOverlay, Modal, Dialog } from 'react-aria-components'

interface IProps {
  zIndex: number
  close?: () => void
  ariaLabel?: string
  ariaLabelledBy?: string
}

const ModalView: React.FC<IProps> = ({ zIndex, close, ariaLabel, ariaLabelledBy, children }) => {
  return (
    <ModalOverlay
      className="modal"
      isOpen={true}
      isDismissable={!!close}
      onOpenChange={(isOpen) => { if (!isOpen) close?.() }}
      style={{ zIndex }}
    >
      <Modal className="modal-content" style={{ zIndex: zIndex + 1 }}>
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
