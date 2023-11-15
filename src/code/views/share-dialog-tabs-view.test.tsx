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
    expect(screen.getByTestId('share-dialog-tabs-view')).toBeInTheDocument()
    expect(screen.getByTestId('sharing-tab-link')).toBeInTheDocument()
    expect(screen.getByTestId('sharing-tab-embed')).toBeInTheDocument()
    expect(screen.queryByTestId('sharing-tab-api')).toBeNull()
    expect(screen.getByTestId('link-tab-contents')).toBeInTheDocument()
    expect(screen.queryByTestId('embed-tab-contents')).toBeNull()
    expect(screen.queryByTestId('lara-api-tab-contents')).toBeNull()
    expect(screen.getByTestId('copy-anchor-link')).toBeInTheDocument()

    await userEvent.click(screen.getByTestId('copy-anchor-link'))
    await userEvent.click(screen.getByTestId('sharing-tab-embed'))

    expect(mockCopy).toHaveBeenCalledTimes(1)
    expect(mockSelectTab).toHaveBeenCalledTimes(1)
    expect(mockSelectTab.mock.calls[0][0]).toBe('embed')

    // renders with the embed tab active
    rerender(
      <ShareDialogTabsView tabSelected='embed' linkUrl='https://concord.org/link' embedUrl='https://concord.org/embed'
        onSelectTab={mockSelectTab} onCopyClick={mockCopy} />
    )
    expect(screen.getByTestId('share-dialog-tabs-view')).toBeInTheDocument()
    expect(screen.getByTestId('sharing-tab-link')).toBeInTheDocument()
    expect(screen.getByTestId('sharing-tab-embed')).toBeInTheDocument()
    expect(screen.queryByTestId('link-tab-contents')).toBeNull()
    expect(screen.getByTestId('embed-tab-contents')).toBeInTheDocument()
    expect(screen.queryByTestId('lara-api-tab-contents')).toBeNull()
    expect(screen.getByTestId('copy-anchor-link')).toBeInTheDocument()

    await userEvent.click(screen.getByTestId('copy-anchor-link'))
    await userEvent.click(screen.getByTestId('sharing-tab-link'))

    expect(mockCopy).toHaveBeenCalledTimes(2)
    expect(mockSelectTab).toHaveBeenCalledTimes(2)
    expect(mockSelectTab.mock.calls[1][0]).toBe('link')

    // fails gracefully with invalid tab specified
    rerender(
      <ShareDialogTabsView tabSelected={'foo' as any} linkUrl='https://concord.org/link' embedUrl='https://concord.org/embed'
        onSelectTab={mockSelectTab} onCopyClick={mockCopy} />
    )
    expect(screen.getByTestId('share-dialog-tabs-view')).toBeInTheDocument()
    expect(screen.getByTestId('sharing-tab-link')).toBeInTheDocument()
    expect(screen.getByTestId('sharing-tab-embed')).toBeInTheDocument()
    expect(screen.queryByTestId('link-tab-contents')).toBeNull()
    expect(screen.queryByTestId('embed-tab-contents')).toBeNull()
    expect(screen.queryByTestId('lara-api-tab-contents')).toBeNull()
    expect(screen.queryByTestId('copy-anchor-link')).toBeNull()
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
    expect(screen.getByTestId('share-dialog-tabs-view')).toBeInTheDocument()
    expect(screen.getByTestId('sharing-tab-link')).toBeInTheDocument()
    expect(screen.getByTestId('sharing-tab-embed')).toBeInTheDocument()
    expect(screen.getByTestId('sharing-tab-api')).toBeInTheDocument()
    expect(screen.queryByTestId('link-tab-contents')).toBeNull()
    expect(screen.queryByTestId('embed-tab-contents')).toBeNull()
    expect(screen.getByTestId('lara-api-tab-contents')).toHaveClass('api')

    await userEvent.click(screen.getByTestId('sharing-tab-api'))

    expect(mockSelectTab).toHaveBeenCalledTimes(1)
    expect(mockSelectTab.mock.calls[0][0]).toBe('api')
  })

})
