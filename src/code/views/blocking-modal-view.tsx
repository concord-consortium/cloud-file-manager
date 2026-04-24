import React from 'react'
import ModalView from './modal-view'

interface BlockingModalViewProps {
  title?: string
  message?: string
  close?: () => void
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void
}

const BlockingModalView: React.FC<BlockingModalViewProps> = ({ title, message, close, onDrop }) => {
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    onDrop?.(e)
  }

  return (
    <ModalView zIndex={500} close={close} ariaLabel={title || message || "Dialog"}>
      <div className="modal-dialog" data-testid="cfm-blocking-modal" onDrop={handleDrop}>
        <div className="modal-dialog-wrapper" data-testid="cfm-blocking-modal-wrapper">
          <div className="modal-dialog-title" data-testid="cfm-blocking-modal-title">
            {title || 'Untitled Dialog'}
          </div>
          <div className="modal-dialog-workspace" data-testid="cfm-blocking-modal-workspace">
            <div className="modal-dialog-blocking-message" data-testid="cfm-blocking-modal-message">
              {message}
            </div>
          </div>
        </div>
      </div>
    </ModalView>
  )
}

export default BlockingModalView
