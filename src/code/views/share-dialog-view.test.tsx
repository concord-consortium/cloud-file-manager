import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from "react"
import ShareDialogView from './share-dialog-view'

describe('ShareDialogView', () => {

  it('should render unshared without LARA', async () => {
    const mockAlert = jest.fn()
    const mockToggleShare = jest.fn(callback => callback?.())
    const mockUpdateShare = jest.fn()
    const mockClose = jest.fn()

    // render unshared without LARA
    render(
      <ShareDialogView currentBaseUrl='https://concord.org/baseUrl' isShared={false}
        onAlert={mockAlert} onToggleShare={mockToggleShare} onUpdateShare={mockUpdateShare} close={mockClose} />
    )
    expect(screen.getByTestId('share-dialog')).toBeInTheDocument()
    expect(screen.queryByTestId('toggle-anchor')).toBeNull()
    expect(screen.queryByTestId('preview-anchor')).toBeNull()

    await userEvent.click(screen.getByTestId('share-button-element'))

    expect(mockToggleShare).toHaveBeenCalled()
    expect(mockUpdateShare).not.toHaveBeenCalled()
})

  it('should render shared without LARA', async () => {
    const mockAlert = jest.fn()
    const mockToggleShare = jest.fn()
    const mockUpdateShare = jest.fn()
    const mockClose = jest.fn()

    ;(window as any).clipboardData = {
      getData: jest.fn(),
      setData: jest.fn()
    }

    // render shared without LARA
    const { rerender } = render(
      <ShareDialogView currentBaseUrl='https://concord.org/baseUrl' isShared={true}
        sharedDocumentUrl='https://concord.org/sharedDocumentUrl'
        onAlert={mockAlert} onToggleShare={mockToggleShare} onUpdateShare={mockUpdateShare} close={mockClose} />
    )
    expect(screen.getByTestId('share-dialog')).toBeInTheDocument()

    await userEvent.click(screen.getByTestId('share-button-element'))

    expect(mockToggleShare).not.toHaveBeenCalled()
    expect(mockUpdateShare).toHaveBeenCalled()

    await userEvent.click(screen.getByTestId('copy-anchor-link'))
    await userEvent.click(screen.getByTestId('sharing-tab-embed'))

    rerender(
      <ShareDialogView currentBaseUrl='https://concord.org/baseUrl' isShared={true}
        sharedDocumentUrl='https://concord.org/sharedDocumentUrl'
        onAlert={mockAlert} onToggleShare={mockToggleShare} onUpdateShare={mockUpdateShare} close={mockClose} />
    )

    await userEvent.click(screen.getByTestId('copy-anchor-link'))
    await userEvent.click(screen.getByTestId('sharing-tab-link'))
})

  it('should render legacy shared without LARA', () => {
    const mockAlert = jest.fn()
    const mockToggleShare = jest.fn()
    const mockUpdateShare = jest.fn()
    const mockClose = jest.fn()

    // render shared without LARA
    render(
      <ShareDialogView currentBaseUrl='https://concord.org/baseUrl' isShared={true} sharedDocumentId='12345'
        onAlert={mockAlert} onToggleShare={mockToggleShare} onUpdateShare={mockUpdateShare} close={mockClose} />
    )
    expect(screen.getByTestId('share-dialog')).toBeInTheDocument()
  })

  it('should render unshared with LARA', () => {
    const mockAlert = jest.fn()
    const mockToggleShare = jest.fn()
    const mockUpdateShare = jest.fn()
    const mockClose = jest.fn()

    // render unshared with LARA
    render(
      <ShareDialogView currentBaseUrl='https://concord.org/baseUrl' isShared={false} enableLaraSharing={true}
        onAlert={mockAlert} onToggleShare={mockToggleShare} onUpdateShare={mockUpdateShare} close={mockClose} />
    )
    expect(screen.getByTestId('share-dialog')).toBeInTheDocument()
  })

  it('should render shared with interactive api sharing', async () => {
    const mockAlert = jest.fn()
    const mockToggleShare = jest.fn(callback => callback?.())
    const mockUpdateShare = jest.fn()
    const mockClose = jest.fn()

    ;(window as any).clipboardData = {
      getData: jest.fn(),
      setData: jest.fn()
    }

    // render shared with interactive api sharing
    const { rerender } = render(
      <ShareDialogView currentBaseUrl='https://concord.org/baseUrl' isShared={true} enableLaraSharing={true}
        onAlert={mockAlert} onToggleShare={mockToggleShare} onUpdateShare={mockUpdateShare} close={mockClose} />
    )
    expect(screen.getByTestId('share-dialog')).toBeInTheDocument()

    await userEvent.click(screen.getByTestId('sharing-tab-api'))

    rerender(
      <ShareDialogView currentBaseUrl='https://concord.org/baseUrl' isShared={true} enableLaraSharing={true}
        onAlert={mockAlert} onToggleShare={mockToggleShare} onUpdateShare={mockUpdateShare} close={mockClose} />
    )

    // copy interactive api share url
    await userEvent.click(screen.getByTestId('copy-anchor-link'))

    // trigger change handlers
    fireEvent.change(screen.getByTestId('server-url-input'), { target: { value: 'https://concord.org/newServerUrl' } })
    await userEvent.click(screen.getByTestId('fullscreen-scaling-checkbox'))
    await userEvent.click(screen.getByTestId('visibility-toggles-checkbox'))
  })
})
