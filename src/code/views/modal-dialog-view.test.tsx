import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from "react"
import ModalDialogView from './modal-dialog-view'

describe('ModalDialogView', () => {
  it('should render with defaults', async () => {
    render(
      <ModalDialogView />
    )
    expect(screen.getByTestId('modal-dialog')).toBeInTheDocument()

    // the close icon is not present if close callback not specified
    expect(screen.queryByTestId(/modal-dialog-close/)).toBeNull()

    // escape key has no effect if close callback not specified
    await userEvent.type(document.body, '{esc}')
    expect(screen.getByTestId('modal-dialog')).toBeInTheDocument()

    // enter key has no effect
    await userEvent.type(document.body, '{enter}')
    expect(screen.getByTestId('modal-dialog')).toBeInTheDocument()

    // resize handler is triggered on resize
    fireEvent(window, new Event('resize'))
    expect(screen.getByTestId('modal-dialog')).toBeInTheDocument()
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
    expect(screen.getByTestId('modal-dialog')).toBeInTheDocument()
  })

  it('should call close when close icon clicked', async () => {
    const mockClose = jest.fn()
    render(
      <ModalDialogView close={mockClose} />
    )
    expect(screen.getByTestId('modal-dialog')).toBeInTheDocument()

    await userEvent.click(screen.getByTestId('modal-dialog-close'))
    expect(mockClose).toHaveBeenCalled()
  })

  it('should call close when escape key pressed', async () => {
    const mockClose = jest.fn()
    render(
      <ModalDialogView close={() => mockClose()} />
    )

    const dialog = screen.getByTestId('modal-dialog')
    expect(dialog).toBeInTheDocument()

    fireEvent.keyUp(dialog, { charCode: "Escape", keyCode: 27 })
    expect(mockClose).toHaveBeenCalled()
  })
})
