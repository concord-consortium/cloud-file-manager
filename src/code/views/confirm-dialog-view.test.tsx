import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import ConfirmDialogView from './confirm-dialog-view'

describe('ConfirmDialogView', () => {
  it('should render with default title and button labels', () => {
    render(
      <ConfirmDialogView message="Delete this file?" />
    )
    // Default title is "Are you sure?" from translation
    expect(screen.getByText('Are you sure?')).toBeInTheDocument()
    expect(screen.getByText('Delete this file?')).toBeInTheDocument()
    expect(screen.getByText('Yes')).toBeInTheDocument()
    expect(screen.getByText('No')).toBeInTheDocument()
  })

  it('should render with custom title', () => {
    render(
      <ConfirmDialogView title="Custom Title" message="Test" />
    )
    expect(screen.getByText('Custom Title')).toBeInTheDocument()
  })

  it('should render with custom button labels', () => {
    render(
      <ConfirmDialogView
        message="Delete file?"
        yesTitle="Delete"
        noTitle="Cancel"
      />
    )
    expect(screen.getByText('Delete')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('should render HTML message content', () => {
    render(
      <ConfirmDialogView message="<em>Important</em> question" />
    )
    const messageDiv = document.querySelector('.confirm-dialog-message')
    expect(messageDiv).toBeInTheDocument()
    expect(messageDiv?.innerHTML).toBe('<em>Important</em> question')
  })

  it('should call callback and close when Yes clicked', async () => {
    const mockCallback = jest.fn()
    const mockClose = jest.fn()
    render(
      <ConfirmDialogView
        message="Confirm?"
        callback={mockCallback}
        close={mockClose}
      />
    )

    await userEvent.click(screen.getByText('Yes'))
    expect(mockCallback).toHaveBeenCalledTimes(1)
    expect(mockClose).toHaveBeenCalledTimes(1)
  })

  it('should call rejectCallback and close when No clicked', async () => {
    const mockRejectCallback = jest.fn()
    const mockClose = jest.fn()
    render(
      <ConfirmDialogView
        message="Confirm?"
        rejectCallback={mockRejectCallback}
        close={mockClose}
      />
    )

    await userEvent.click(screen.getByText('No'))
    expect(mockRejectCallback).toHaveBeenCalledTimes(1)
    expect(mockClose).toHaveBeenCalledTimes(1)
  })

  it('should hide No button when hideNoButton is true', () => {
    render(
      <ConfirmDialogView message="Acknowledge?" hideNoButton={true} />
    )
    expect(screen.getByText('Yes')).toBeInTheDocument()
    expect(screen.queryByText('No')).not.toBeInTheDocument()
  })

  it('should apply custom className', () => {
    render(
      <ConfirmDialogView message="Test" className="custom-class" />
    )
    const dialog = document.querySelector('.confirm-dialog')
    expect(dialog).toHaveClass('custom-class')
  })

  it('should work without callbacks', async () => {
    render(
      <ConfirmDialogView message="Test" />
    )

    // Should not throw when clicking buttons
    const yesButton = screen.getByText('Yes')
    expect(yesButton).toBeInTheDocument()
    await userEvent.click(yesButton)
  })
})
