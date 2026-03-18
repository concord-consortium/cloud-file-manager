import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import AlertDialogView from './alert-dialog-view'

describe('AlertDialogView', () => {
  it('should render with default title', () => {
    render(
      <AlertDialogView message="Test message" />
    )
    expect(screen.getByText('Alert')).toBeInTheDocument()
    expect(screen.getByText('Test message')).toBeInTheDocument()
  })

  it('should render with custom title', () => {
    render(
      <AlertDialogView title="Custom Title" message="Test message" />
    )
    expect(screen.getByText('Custom Title')).toBeInTheDocument()
  })

  it('should render HTML message content', () => {
    render(
      <AlertDialogView message="<strong>Bold</strong> message" />
    )
    const messageDiv = document.querySelector('.alert-dialog-message')
    expect(messageDiv).toBeInTheDocument()
    expect(messageDiv?.innerHTML).toBe('<strong>Bold</strong> message')
  })

  it('should call close and callback when close button clicked', async () => {
    const mockClose = jest.fn()
    const mockCallback = jest.fn()
    render(
      <AlertDialogView
        message="Test"
        close={mockClose}
        callback={mockCallback}
      />
    )

    await userEvent.click(screen.getByText('Close'))
    expect(mockClose).toHaveBeenCalledTimes(1)
    expect(mockCallback).toHaveBeenCalledTimes(1)
  })

  it('should work without close callback', async () => {
    const mockCallback = jest.fn()
    render(
      <AlertDialogView message="Test" callback={mockCallback} />
    )

    await userEvent.click(screen.getByText('Close'))
    expect(mockCallback).toHaveBeenCalledTimes(1)
  })

  it('should work without any callbacks', async () => {
    render(
      <AlertDialogView message="Test" />
    )

    // Should not throw when clicking close
    await userEvent.click(screen.getByText('Close'))
    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('should have aria-labelledby linking to title', () => {
    render(<AlertDialogView message="Test" />)
    const dialog = screen.getByRole('dialog')
    const titleId = dialog.getAttribute('aria-labelledby')
    expect(titleId).toBeTruthy()
    const titleEl = document.getElementById(titleId!)
    expect(titleEl).toHaveTextContent('Alert')
  })

  it('should have accessible close button', () => {
    const mockClose = jest.fn()
    render(<AlertDialogView message="Test" close={mockClose} />)
    const closeBtn = screen.getByLabelText('Close')
    expect(closeBtn.tagName).toBe('BUTTON')
  })

  it('should focus the Close button on mount', () => {
    render(<AlertDialogView message="Test" />)
    expect(screen.getByText('Close')).toHaveFocus()
  })
})
