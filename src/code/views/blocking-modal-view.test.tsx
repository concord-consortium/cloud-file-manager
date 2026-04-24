import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import BlockingModalView from './blocking-modal-view'

describe('BlockingModalView', () => {
  it('should render with default title', () => {
    render(
      <BlockingModalView message="Loading..." />
    )
    expect(screen.getByText('Untitled Dialog')).toBeInTheDocument()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should render with custom title', () => {
    render(
      <BlockingModalView title="Please Wait" message="Loading..." />
    )
    expect(screen.getByText('Please Wait')).toBeInTheDocument()
  })

  it('should render message in blocking message area', () => {
    render(
      <BlockingModalView message="Processing your request" />
    )
    const messageDiv = document.querySelector('.modal-dialog-blocking-message')
    expect(messageDiv).toBeInTheDocument()
    expect(messageDiv?.textContent).toBe('Processing your request')
  })

  it('should have dialog role', () => {
    render(<BlockingModalView title="Test" message="Loading..." />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('should close on Escape key when dismissable', async () => {
    const user = userEvent.setup()
    const mockClose = jest.fn()
    render(<BlockingModalView message="Test" close={mockClose} />)

    await act(async () => {
      await user.keyboard('{Escape}')
    })
    expect(mockClose).toHaveBeenCalledTimes(1)
  })

  it('should call onDrop when file is dropped', () => {
    const mockOnDrop = jest.fn()
    render(
      <BlockingModalView message="Drop file here" onDrop={mockOnDrop} />
    )

    const dialog = document.querySelector('.modal-dialog')
    expect(dialog).toBeInTheDocument()

    // Simulate drop event
    fireEvent.drop(dialog!, {
      dataTransfer: {
        files: [new File(['content'], 'test.txt', { type: 'text/plain' })]
      }
    })

    expect(mockOnDrop).toHaveBeenCalledTimes(1)
  })

  it('should work without onDrop callback', () => {
    render(
      <BlockingModalView message="Test" />
    )

    const dialog = document.querySelector('.modal-dialog')

    // Should not throw when dropping without handler
    fireEvent.drop(dialog!, {
      dataTransfer: {
        files: [new File(['content'], 'test.txt', { type: 'text/plain' })]
      }
    })

    expect(dialog).toBeInTheDocument()
  })

  it('should have aria-label from title', () => {
    render(<BlockingModalView title="Please Wait" message="Loading..." />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-label', 'Please Wait')
  })

  it('should have aria-label from message when no title', () => {
    render(<BlockingModalView message="Loading..." />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-label', 'Loading...')
  })

  it('should have correct structure', () => {
    render(
      <BlockingModalView title="Title" message="Message" />
    )

    expect(screen.getByTestId('cfm-blocking-modal')).toBeInTheDocument()
    expect(screen.getByTestId('cfm-blocking-modal-wrapper')).toBeInTheDocument()
    expect(screen.getByTestId('cfm-blocking-modal-title')).toBeInTheDocument()
    expect(screen.getByTestId('cfm-blocking-modal-workspace')).toBeInTheDocument()
    expect(screen.getByTestId('cfm-blocking-modal-message')).toBeInTheDocument()
  })
})
