import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from "react"
import { ShareDialogStatusView } from './share-dialog-status-view'

describe('ModalDialogView', () => {
  it('should render when not sharing', async () => {
    const mockToggle = jest.fn()
    const mockUpdate = jest.fn()
    render(
      <ShareDialogStatusView isSharing={false} previewLink='https://concord.org'
        onToggleShare={mockToggle} onUpdateShare={mockUpdate} />
    )
    expect(screen.getByTestId('cfm-dialog-share-status')).toBeInTheDocument()
    expect(screen.queryByTestId('cfm-dialog-share-stop-button')).toBeNull()
    expect(screen.queryByTestId('cfm-dialog-share-preview-button')).toBeNull()

    await userEvent.click(screen.getByTestId('cfm-dialog-share-enable-button'))

    expect(mockToggle).toHaveBeenCalled()
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('should render when sharing', async () => {
    const mockToggle = jest.fn()
    const mockUpdate = jest.fn()
    render(
      <ShareDialogStatusView isSharing={true} previewLink='https://concord.org'
        onToggleShare={mockToggle} onUpdateShare={mockUpdate} />
    )
    expect(screen.getByTestId('cfm-dialog-share-status')).toBeInTheDocument()
    expect(screen.getByTestId('cfm-dialog-share-stop-button')).toBeInTheDocument()
    expect(screen.getByTestId('cfm-dialog-share-preview-button')).toBeInTheDocument()

    await userEvent.click(screen.getByTestId('cfm-dialog-share-update-button'))

    expect(mockToggle).not.toHaveBeenCalled()
    expect(mockUpdate).toHaveBeenCalled()
  })
})
