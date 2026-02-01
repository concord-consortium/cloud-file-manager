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
    <ModalView zIndex={500} close={close}>
      <div className="modal-dialog" onDrop={handleDrop}>
        <div className="modal-dialog-wrapper">
          <div className="modal-dialog-title">
            {title || 'Untitled Dialog'}
          </div>
          <div className="modal-dialog-workspace">
            <div className="modal-dialog-blocking-message">{message}</div>
          </div>
        </div>
      </div>
    </ModalView>
  )
}

export default BlockingModalView
