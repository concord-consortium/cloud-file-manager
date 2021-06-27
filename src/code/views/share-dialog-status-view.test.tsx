import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from "react"
import { ShareDialogStatusView } from './share-dialog-status-view'

describe('ModalDialogView', () => {
  it('should render when not sharing', () => {
    const mockToggle = jest.fn()
    const mockUpdate = jest.fn()
    render(
      <ShareDialogStatusView isSharing={false} previewLink='https://concord.org'
        onToggleShare={mockToggle} onUpdateShare={mockUpdate} />
    )
    expect(screen.getByTestId('share-status')).toBeInTheDocument()
    expect(screen.queryByTestId('toggle-anchor')).toBeNull()
    expect(screen.queryByTestId('preview-anchor')).toBeNull()

    act(() => {
      userEvent.click(screen.getByTestId('share-button-element'))
    })
    expect(mockToggle).toHaveBeenCalled()
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('should render when sharing', () => {
    const mockToggle = jest.fn()
    const mockUpdate = jest.fn()
    render(
      <ShareDialogStatusView isSharing={true} previewLink='https://concord.org'
        onToggleShare={mockToggle} onUpdateShare={mockUpdate} />
    )
    expect(screen.getByTestId('share-status')).toBeInTheDocument()
    expect(screen.getByTestId('toggle-anchor')).toBeInTheDocument()
    expect(screen.getByTestId('preview-anchor')).toBeInTheDocument()

    act(() => {
      userEvent.click(screen.getByTestId('share-button-element'))
    })
    expect(mockToggle).not.toHaveBeenCalled()
    expect(mockUpdate).toHaveBeenCalled()
  })
})
