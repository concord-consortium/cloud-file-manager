import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import RenameDialogView from './rename-dialog-view'

describe('RenameDialogView', () => {
  it('should render with dialog title', () => {
    render(
      <RenameDialogView />
    )
    expect(screen.getByTestId('modal-dialog-title')).toHaveTextContent('Rename')
  })

  it('should render with provided filename', () => {
    render(
      <RenameDialogView filename="my-document.json" />
    )
    const input = screen.getByPlaceholderText('Filename') as HTMLInputElement
    expect(input.value).toBe('my-document.json')
  })

  it('should render with empty filename by default', () => {
    render(
      <RenameDialogView />
    )
    const input = screen.getByPlaceholderText('Filename') as HTMLInputElement
    expect(input.value).toBe('')
  })

  it('should update filename as user types', async () => {
    render(
      <RenameDialogView />
    )
    const input = screen.getByPlaceholderText('Filename') as HTMLInputElement
    await userEvent.type(input, 'new-name.json')
    expect(input.value).toBe('new-name.json')
  })

  it('should call callback and close when Rename button clicked with valid filename', async () => {
    const mockCallback = jest.fn()
    const mockClose = jest.fn()
    render(
      <RenameDialogView
        filename="test.json"
        callback={mockCallback}
        close={mockClose}
      />
    )

    const renameButton = document.querySelector('.rename-dialog .buttons button:first-child') as HTMLButtonElement
    await userEvent.click(renameButton)
    expect(mockCallback).toHaveBeenCalledWith('test.json')
    expect(mockClose).toHaveBeenCalledTimes(1)
  })

  it('should not call callback when filename is empty', async () => {
    const mockCallback = jest.fn()
    const mockClose = jest.fn()
    render(
      <RenameDialogView
        filename=""
        callback={mockCallback}
        close={mockClose}
      />
    )

    const renameButton = document.querySelector('.rename-dialog .buttons button:first-child') as HTMLButtonElement
    await userEvent.click(renameButton)
    expect(mockCallback).not.toHaveBeenCalled()
    expect(mockClose).not.toHaveBeenCalled()
  })

  it('should not call callback when filename is only whitespace', async () => {
    const mockCallback = jest.fn()
    const mockClose = jest.fn()
    render(
      <RenameDialogView
        filename="   "
        callback={mockCallback}
        close={mockClose}
      />
    )

    const renameButton = document.querySelector('.rename-dialog .buttons button:first-child') as HTMLButtonElement
    await userEvent.click(renameButton)
    expect(mockCallback).not.toHaveBeenCalled()
    expect(mockClose).not.toHaveBeenCalled()
  })

  it('should call close when Cancel clicked', async () => {
    const mockClose = jest.fn()
    render(
      <RenameDialogView
        filename="test.json"
        close={mockClose}
      />
    )

    await userEvent.click(screen.getByText('Cancel'))
    expect(mockClose).toHaveBeenCalledTimes(1)
  })

  it('should have disabled class on Rename button when filename is empty', () => {
    render(
      <RenameDialogView filename="" />
    )
    const renameButton = document.querySelector('.rename-dialog .buttons button:first-child')
    expect(renameButton).toHaveClass('disabled')
  })

  it('should not have disabled class on Rename button when filename has content', () => {
    render(
      <RenameDialogView filename="test.json" />
    )
    const renameButton = document.querySelector('.rename-dialog .buttons button:first-child')
    expect(renameButton).not.toHaveClass('disabled')
  })
})
