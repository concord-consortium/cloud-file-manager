import React, { useEffect, useRef } from 'react'
import { ModalOverlay, Modal, Dialog } from 'react-aria-components'
import { getLastFocusedElement } from '../utils/focus-tracker'

interface IProps {
  zIndex?: number
  close?: () => void
  ariaLabel?: string
  ariaLabelledBy?: string
}

const ModalView: React.FC<IProps> = ({ zIndex, close, ariaLabel, ariaLabelledBy, children }) => {
  const overlayStyle = zIndex ? { zIndex } : undefined
  const modalStyle = zIndex ? { zIndex: zIndex + 1 } : undefined

  // Capture the last focused interactive element before the dialog opened.
  // We use the global focus tracker because by the time this component mounts,
  // the triggering menu may have already closed and moved focus to <body>.
  const triggerRef = useRef<HTMLElement | null>(getLastFocusedElement())

  useEffect(() => {
    const trigger = triggerRef.current
    return () => {
      if (trigger && document.contains(trigger) && typeof trigger.focus === 'function') {
        setTimeout(() => trigger.focus(), 0)
      }
    }
  }, [])

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
