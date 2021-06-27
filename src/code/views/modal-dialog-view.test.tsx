import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from "react"
import ModalDialogView from './modal-dialog-view'

describe('ModalDialogView', () => {
  it('should render with defaults', () => {
    render(
      <ModalDialogView />
    )
    expect(screen.getByTestId('modal-dialog')).toBeInTheDocument()

    // clicking close icon has no effect if close callback not specified
    act(() => {
      userEvent.click(screen.getByTestId('modal-dialog-close'))
    })
    expect(screen.getByTestId('modal-dialog')).toBeInTheDocument()

    // escape key has no effect if close callback not specified
    act(() => {
      userEvent.type(document.body, '{esc}')
    })
    expect(screen.getByTestId('modal-dialog')).toBeInTheDocument()

    // enter key has no effect
    act(() => {
      userEvent.type(document.body, '{enter}')
    })
    expect(screen.getByTestId('modal-dialog')).toBeInTheDocument()

    // resize handler is triggered on resize
    act(() => {
      fireEvent(window, new Event('resize'))
    })
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

  it('should call close when close icon clicked', () => {
    const mockClose = jest.fn()
    render(
      <ModalDialogView close={mockClose} />
    )
    expect(screen.getByTestId('modal-dialog')).toBeInTheDocument()

    act(() => {
      userEvent.click(screen.getByTestId('modal-dialog-close'))
    })
    expect(mockClose).toHaveBeenCalled()
  })

  it('should call close when escape key pressed', () => {
    const mockClose = jest.fn()
    render(
      <ModalDialogView close={mockClose} />
    )
    expect(screen.getByTestId('modal-dialog')).toBeInTheDocument()

    act(() => {
      userEvent.type(document.body, '{esc}')
    })
    expect(mockClose).toHaveBeenCalled()
  })
})
