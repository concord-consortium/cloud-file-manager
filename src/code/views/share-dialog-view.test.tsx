import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from "react"
import ShareDialogView from './share-dialog-view'

describe('ShareDialogView', () => {

  it('should render unshared without LARA', () => {
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

    act(() => {
      userEvent.click(screen.getByTestId('share-button-element'))
    })
    expect(mockToggleShare).toHaveBeenCalled()
    expect(mockUpdateShare).not.toHaveBeenCalled()
})

  it('should render shared without LARA', () => {
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

    act(() => {
      userEvent.click(screen.getByTestId('share-button-element'))
    })
    expect(mockToggleShare).not.toHaveBeenCalled()
    expect(mockUpdateShare).toHaveBeenCalled()

    act(() => {
      userEvent.click(screen.getByTestId('copy-anchor-link'))
      userEvent.click(screen.getByTestId('sharing-tab-embed'))
    })

    rerender(
      <ShareDialogView currentBaseUrl='https://concord.org/baseUrl' isShared={true}
        sharedDocumentUrl='https://concord.org/sharedDocumentUrl'
        onAlert={mockAlert} onToggleShare={mockToggleShare} onUpdateShare={mockUpdateShare} close={mockClose} />
    )

    act(() => {
      userEvent.click(screen.getByTestId('copy-anchor-link'))
      userEvent.click(screen.getByTestId('sharing-tab-link'))
    })
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

  it('should render shared with LARA', () => {
    const mockAlert = jest.fn()
    const mockToggleShare = jest.fn(callback => callback?.())
    const mockUpdateShare = jest.fn()
    const mockClose = jest.fn()

    ;(window as any).clipboardData = {
      getData: jest.fn(),
      setData: jest.fn()
    }

    // render shared with LARA
    const { rerender } = render(
      <ShareDialogView currentBaseUrl='https://concord.org/baseUrl' isShared={true} enableLaraSharing={true}
        sharedDocumentUrl='https://concord.org/sharedDocumentUrl'
        onAlert={mockAlert} onToggleShare={mockToggleShare} onUpdateShare={mockUpdateShare} close={mockClose} />
    )
    expect(screen.getByTestId('share-dialog')).toBeInTheDocument()

    act(() => {
      userEvent.click(screen.getByTestId('sharing-tab-lara'))
    })

    rerender(
      <ShareDialogView currentBaseUrl='https://concord.org/baseUrl' isShared={true} enableLaraSharing={true}
        sharedDocumentUrl='https://concord.org/sharedDocumentUrl'
        onAlert={mockAlert} onToggleShare={mockToggleShare} onUpdateShare={mockUpdateShare} close={mockClose} />
    )

    act(() => {
      // copy LARA share url
      userEvent.click(screen.getByTestId('copy-anchor-link'))
    })

    act(() => {
      // trigger change handlers
      fireEvent.change(screen.getByTestId('server-url-input'), { target: { value: 'https://concord.org/newServerUrl' } })
      userEvent.click(screen.getByTestId('fullscreen-scaling-checkbox'))
      userEvent.click(screen.getByTestId('visibility-toggles-checkbox'))
    })
  })


  it('should render shared with interactive api sharing', () => {
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

    act(() => {
      userEvent.click(screen.getByTestId('sharing-tab-api'))
    })

    rerender(
      <ShareDialogView currentBaseUrl='https://concord.org/baseUrl' isShared={true} enableLaraSharing={true}
        onAlert={mockAlert} onToggleShare={mockToggleShare} onUpdateShare={mockUpdateShare} close={mockClose} />
    )

    act(() => {
      // copy interactive api share url
      userEvent.click(screen.getByTestId('copy-anchor-link'))
    })

    act(() => {
      // trigger change handlers
      fireEvent.change(screen.getByTestId('server-url-input'), { target: { value: 'https://concord.org/newServerUrl' } })
      userEvent.click(screen.getByTestId('fullscreen-scaling-checkbox'))
      userEvent.click(screen.getByTestId('visibility-toggles-checkbox'))
    })
  })
})
