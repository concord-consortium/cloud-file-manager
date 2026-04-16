import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import RenameDialogView from './rename-dialog-view'

describe('RenameDialogView', () => {
  it('should render with dialog title', () => {
    render(
      <RenameDialogView />
    )
    expect(screen.getByTestId('cfm-dialog-title')).toHaveTextContent('Rename')
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

    const renameButton = screen.getByRole('button', { name: /rename/i })
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

    const renameButton = screen.getByRole('button', { name: /rename/i })
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

    const renameButton = screen.getByRole('button', { name: /rename/i })
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

  it('should submit when Enter pressed with valid filename', async () => {
    const mockCallback = jest.fn()
    const mockClose = jest.fn()
    render(
      <RenameDialogView
        filename="test.json"
        callback={mockCallback}
        close={mockClose}
      />
    )

    const input = screen.getByPlaceholderText('Filename')
    await userEvent.type(input, '{Enter}')
    expect(mockCallback).toHaveBeenCalledWith('test.json')
    expect(mockClose).toHaveBeenCalledTimes(1)
  })

  it('should not submit when Enter pressed with empty filename', async () => {
    const mockCallback = jest.fn()
    const mockClose = jest.fn()
    render(
      <RenameDialogView
        filename=""
        callback={mockCallback}
        close={mockClose}
      />
    )

    const input = screen.getByPlaceholderText('Filename')
    await userEvent.type(input, '{Enter}')
    expect(mockCallback).not.toHaveBeenCalled()
    expect(mockClose).not.toHaveBeenCalled()
  })

  it('should have aria-label on filename input', () => {
    render(<RenameDialogView />)
    expect(screen.getByLabelText('Filename')).toBeInTheDocument()
  })

  it('should have disabled attribute on Rename button when filename is empty', () => {
    render(<RenameDialogView filename="" />)
    const renameButton = screen.getByRole('button', { name: /rename/i })
    expect(renameButton).toBeDisabled()
  })

  it('should have disabled class on Rename button when filename is empty', () => {
    render(
      <RenameDialogView filename="" />
    )
    const renameButton = screen.getByRole('button', { name: /rename/i })
    expect(renameButton).toHaveClass('disabled')
  })

  it('should not have disabled class on Rename button when filename has content', () => {
    render(
      <RenameDialogView filename="test.json" />
    )
    const renameButton = screen.getByRole('button', { name: /rename/i })
    expect(renameButton).not.toHaveClass('disabled')
  })
})
