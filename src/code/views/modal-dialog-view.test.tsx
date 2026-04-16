import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from "react"
import ModalDialogView from './modal-dialog-view'

describe('ModalDialogView', () => {
  it('should render with defaults', async () => {
    render(
      <ModalDialogView />
    )
    expect(screen.getByTestId('cfm-dialog-title')).toBeInTheDocument()

    // the close icon is not present if close callback not specified
    expect(screen.queryByTestId(/cfm-dialog-close-button/)).toBeNull()

    // escape key has no effect if close callback not specified
    await userEvent.type(document.body, '{esc}')
    expect(screen.getByTestId('cfm-dialog-title')).toBeInTheDocument()

    // enter key has no effect
    await userEvent.type(document.body, '{enter}')
    expect(screen.getByTestId('cfm-dialog-title')).toBeInTheDocument()

    // resize handler is triggered on resize
    fireEvent(window, new Event('resize'))
    expect(screen.getByTestId('cfm-dialog-title')).toBeInTheDocument()
  })

  it('should render user-specified title and content', () => {
    render(
      <ModalDialogView title='Foo Title'>
        Bar Contents
      </ModalDialogView>
    )
    expect(screen.getByText('Foo Title')).toBeInTheDocument()
    expect(screen.getByText('Bar Contents')).toBeInTheDocument()
  })

  it('should render with user-specified zIndex', () => {
    render(
      <ModalDialogView zIndex={0} />
    )
    expect(screen.getByTestId('cfm-dialog-title')).toBeInTheDocument()
  })

  it('should call close when close icon clicked', async () => {
    const mockClose = jest.fn()
    render(
      <ModalDialogView close={mockClose} />
    )
    expect(screen.getByTestId('cfm-dialog-title')).toBeInTheDocument()

    await userEvent.click(screen.getByTestId('cfm-dialog-close-button'))
    expect(mockClose).toHaveBeenCalled()
  })

  it('should call close when escape key pressed', async () => {
    const mockClose = jest.fn()
    render(
      <ModalDialogView close={() => mockClose()} />
    )

    const dialog = screen.getByTestId('cfm-dialog-title')
    expect(dialog).toBeInTheDocument()

    await userEvent.keyboard('{Escape}')
    expect(mockClose).toHaveBeenCalled()
  })
})
