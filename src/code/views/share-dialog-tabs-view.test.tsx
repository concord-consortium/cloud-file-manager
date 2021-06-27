import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from "react"
import { ILaraTabProps, ShareDialogTabsView } from './share-dialog-tabs-view'

describe('ShareDialogTabsView', () => {

  it('renders without LARA sharing', async () => {
    const mockEmbed = jest.fn()
    const mockLink = jest.fn()
    const mockCopy = jest.fn()

    ;(window as any).clipboardData = {
      getData: jest.fn(),
      setData: jest.fn()
    }

    // renders with the link tab active
    const { rerender } = render(
      <ShareDialogTabsView tabSelected='link' linkUrl='https://concord.org/link' embedUrl='https://concord.org/embed'
        onSelectLinkTab={mockLink} onSelectEmbedTab={mockEmbed} onCopyClick={mockCopy} />
    )
    expect(screen.getByTestId('share-dialog-tabs-view')).toBeInTheDocument()
    expect(screen.getByTestId('sharing-tab-link')).toBeInTheDocument()
    expect(screen.getByTestId('sharing-tab-embed')).toBeInTheDocument()
    expect(screen.queryByTestId('sharing-tab-lara')).toBeNull()
    expect(screen.getByTestId('link-tab-contents')).toBeInTheDocument()
    expect(screen.queryByTestId('embed-tab-contents')).toBeNull()
    expect(screen.queryByTestId('lara-tab-contents')).toBeNull()
    expect(screen.getByTestId('copy-anchor-link')).toBeInTheDocument()

    act(() => {
      userEvent.click(screen.getByTestId('copy-anchor-link'))
      userEvent.click(screen.getByTestId('sharing-tab-embed'))
    })
    expect(mockCopy).toHaveBeenCalledTimes(1)
    expect(mockEmbed).toHaveBeenCalled()
    expect(mockLink).not.toHaveBeenCalled()

    // renders with the embed tab active
    rerender(
      <ShareDialogTabsView tabSelected='embed' linkUrl='https://concord.org/link' embedUrl='https://concord.org/embed'
        onSelectLinkTab={mockLink} onSelectEmbedTab={mockEmbed} onCopyClick={mockCopy} />
    )
    expect(screen.getByTestId('share-dialog-tabs-view')).toBeInTheDocument()
    expect(screen.getByTestId('sharing-tab-link')).toBeInTheDocument()
    expect(screen.getByTestId('sharing-tab-embed')).toBeInTheDocument()
    expect(screen.queryByTestId('sharing-tab-lara')).toBeNull()
    expect(screen.queryByTestId('link-tab-contents')).toBeNull()
    expect(screen.getByTestId('embed-tab-contents')).toBeInTheDocument()
    expect(screen.queryByTestId('lara-tab-contents')).toBeNull()
    expect(screen.getByTestId('copy-anchor-link')).toBeInTheDocument()

    act(() => {
      userEvent.click(screen.getByTestId('copy-anchor-link'))
      userEvent.click(screen.getByTestId('sharing-tab-link'))
    })
    expect(mockCopy).toHaveBeenCalledTimes(2)
    expect(mockEmbed).toHaveBeenCalled()
    expect(mockLink).toHaveBeenCalled()

    // fails gracefully with invalid tab specified
    rerender(
      <ShareDialogTabsView tabSelected={'foo' as any} linkUrl='https://concord.org/link' embedUrl='https://concord.org/embed'
        onSelectLinkTab={mockLink} onSelectEmbedTab={mockEmbed} onCopyClick={mockCopy} />
    )
    expect(screen.getByTestId('share-dialog-tabs-view')).toBeInTheDocument()
    expect(screen.getByTestId('sharing-tab-link')).toBeInTheDocument()
    expect(screen.getByTestId('sharing-tab-embed')).toBeInTheDocument()
    expect(screen.queryByTestId('sharing-tab-lara')).toBeNull()
    expect(screen.queryByTestId('link-tab-contents')).toBeNull()
    expect(screen.queryByTestId('embed-tab-contents')).toBeNull()
    expect(screen.queryByTestId('lara-tab-contents')).toBeNull()
    expect(screen.queryByTestId('copy-anchor-link')).toBeNull()
  })

  it('renders with LARA sharing', async () => {
    const mockEmbed = jest.fn()
    const mockLink = jest.fn()
    const mockLara = jest.fn()
    const mockCopy = jest.fn()
    const mockChangeServerUrl = jest.fn()
    const mockChangeFullscreenScaling = jest.fn()
    const mockChangeVisibilityToggles = jest.fn()

    // renders with the lara tab active
    const laraTabProps: ILaraTabProps = {
      serverUrlLabel: 'ServerUrl',
      serverUrl: 'https://concord.org/server',
      fullscreenScaling: false,
      visibilityToggles: false,
      url: 'https:/concord.org/url',
      onCopyClick: mockCopy,
      onChangeServerUrl: mockChangeServerUrl,
      onChangeFullscreenScaling: mockChangeFullscreenScaling,
      onChangeVisibilityToggles: mockChangeVisibilityToggles
    }
    render(
      <ShareDialogTabsView tabSelected='lara' linkUrl='https://concord.org/link' embedUrl='https://concord.org/embed'
        onSelectLinkTab={mockLink} onSelectEmbedTab={mockEmbed} onSelectLaraTab={mockLara} onCopyClick={mockCopy}
        enableLaraSharing={true} lara={laraTabProps}/>
    )
    expect(screen.getByTestId('share-dialog-tabs-view')).toBeInTheDocument()
    expect(screen.getByTestId('sharing-tab-link')).toBeInTheDocument()
    expect(screen.getByTestId('sharing-tab-embed')).toBeInTheDocument()
    expect(screen.getByTestId('sharing-tab-lara')).toBeInTheDocument()
    expect(screen.queryByTestId('link-tab-contents')).toBeNull()
    expect(screen.queryByTestId('embed-tab-contents')).toBeNull()
    expect(screen.getByTestId('lara-tab-contents')).toBeInTheDocument()

    act(() => {
      userEvent.click(screen.getByTestId('sharing-tab-lara'))
    })
    expect(mockLara).toHaveBeenCalled()
    expect(mockEmbed).not.toHaveBeenCalled()
    expect(mockLink).not.toHaveBeenCalled()
  })

})
