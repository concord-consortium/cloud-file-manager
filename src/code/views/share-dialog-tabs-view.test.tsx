import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from "react"
import { IShareDialogLaraApiTabProps, ShareDialogTabsView } from './share-dialog-tabs-view'

describe('ShareDialogTabsView', () => {

  it('renders without LARA sharing', async () => {
    const mockSelectTab = jest.fn()
    const mockCopy = jest.fn()

    ;(window as any).clipboardData = {
      getData: jest.fn(),
      setData: jest.fn()
    }

    // renders with the link tab active
    const { rerender } = render(
      <ShareDialogTabsView tabSelected='link' linkUrl='https://concord.org/link' embedUrl='https://concord.org/embed'
        onSelectTab={mockSelectTab} onCopyClick={mockCopy} />
    )
    expect(screen.getByTestId('cfm-dialog-share-tabs-container')).toBeInTheDocument()
    expect(screen.getByTestId('cfm-dialog-share-tab-link')).toBeInTheDocument()
    expect(screen.getByTestId('cfm-dialog-share-tab-embed')).toBeInTheDocument()
    expect(screen.queryByTestId('cfm-dialog-share-tab-api')).toBeNull()
    expect(screen.getByTestId('cfm-dialog-share-link-contents')).toBeInTheDocument()
    expect(screen.queryByTestId('cfm-dialog-share-embed-contents')).toBeNull()
    expect(screen.queryByTestId('cfm-dialog-share-api-contents')).toBeNull()
    expect(screen.getByTestId('cfm-dialog-share-copy-button')).toBeInTheDocument()

    await userEvent.click(screen.getByTestId('cfm-dialog-share-copy-button'))
    await userEvent.click(screen.getByTestId('cfm-dialog-share-tab-embed'))

    expect(mockCopy).toHaveBeenCalledTimes(1)
    expect(mockSelectTab).toHaveBeenCalledTimes(1)
    expect(mockSelectTab.mock.calls[0][0]).toBe('embed')

    // renders with the embed tab active
    rerender(
      <ShareDialogTabsView tabSelected='embed' linkUrl='https://concord.org/link' embedUrl='https://concord.org/embed'
        onSelectTab={mockSelectTab} onCopyClick={mockCopy} />
    )
    expect(screen.getByTestId('cfm-dialog-share-tabs-container')).toBeInTheDocument()
    expect(screen.getByTestId('cfm-dialog-share-tab-link')).toBeInTheDocument()
    expect(screen.getByTestId('cfm-dialog-share-tab-embed')).toBeInTheDocument()
    expect(screen.queryByTestId('cfm-dialog-share-link-contents')).toBeNull()
    expect(screen.getByTestId('cfm-dialog-share-embed-contents')).toBeInTheDocument()
    expect(screen.queryByTestId('cfm-dialog-share-api-contents')).toBeNull()
    expect(screen.getByTestId('cfm-dialog-share-copy-button')).toBeInTheDocument()

    await userEvent.click(screen.getByTestId('cfm-dialog-share-copy-button'))
    await userEvent.click(screen.getByTestId('cfm-dialog-share-tab-link'))

    expect(mockCopy).toHaveBeenCalledTimes(2)
    expect(mockSelectTab).toHaveBeenCalledTimes(2)
    expect(mockSelectTab.mock.calls[1][0]).toBe('link')

    // fails gracefully with invalid tab specified
    rerender(
      <ShareDialogTabsView tabSelected={'foo' as any} linkUrl='https://concord.org/link' embedUrl='https://concord.org/embed'
        onSelectTab={mockSelectTab} onCopyClick={mockCopy} />
    )
    expect(screen.getByTestId('cfm-dialog-share-tabs-container')).toBeInTheDocument()
    expect(screen.getByTestId('cfm-dialog-share-tab-link')).toBeInTheDocument()
    expect(screen.getByTestId('cfm-dialog-share-tab-embed')).toBeInTheDocument()
    expect(screen.queryByTestId('cfm-dialog-share-link-contents')).toBeNull()
    expect(screen.queryByTestId('cfm-dialog-share-embed-contents')).toBeNull()
    expect(screen.queryByTestId('cfm-dialog-share-api-contents')).toBeNull()
    expect(screen.queryByTestId('cfm-dialog-share-copy-button')).toBeNull()
  })

  it('renders with interactive api sharing', async () => {
    const mockSelectTab = jest.fn()
    const mockCopy = jest.fn()
    const mockChangeServerUrl = jest.fn()

    // renders with the interactive api tab active
    const interactiveApiTabProps: IShareDialogLaraApiTabProps = {
      linkUrl: 'https:/concord.org/url',
      serverUrlLabel: 'ServerUrl',
      serverUrl: 'https://concord.org/server',
      onChangeServerUrl: mockChangeServerUrl
    }
    render(
      <ShareDialogTabsView tabSelected='api' linkUrl='https://concord.org/link' embedUrl='https://concord.org/embed'
        onSelectTab={mockSelectTab} onCopyClick={mockCopy} interactiveApi={interactiveApiTabProps}/>
    )
    expect(screen.getByTestId('cfm-dialog-share-tabs-container')).toBeInTheDocument()
    expect(screen.getByTestId('cfm-dialog-share-tab-link')).toBeInTheDocument()
    expect(screen.getByTestId('cfm-dialog-share-tab-embed')).toBeInTheDocument()
    expect(screen.getByTestId('cfm-dialog-share-tab-api')).toBeInTheDocument()
    expect(screen.getByTestId('cfm-dialog-share-tab-link')).toContainHTML('Link')
    expect(screen.getByTestId('cfm-dialog-share-tab-embed')).toContainHTML('Embed')
    expect(screen.getByTestId('cfm-dialog-share-tab-api')).toContainHTML('Activity Player')
    expect(screen.queryByTestId('cfm-dialog-share-link-contents')).toBeNull()
    expect(screen.queryByTestId('cfm-dialog-share-embed-contents')).toBeNull()
    expect(screen.getByTestId('cfm-dialog-share-api-contents')).toHaveClass('api')

    await userEvent.click(screen.getByTestId('cfm-dialog-share-tab-api'))

    expect(mockSelectTab).toHaveBeenCalledTimes(1)
    expect(mockSelectTab.mock.calls[0][0]).toBe('api')
  })

})
