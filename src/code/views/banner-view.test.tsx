import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { BannerView } from './banner-view'
import * as bannerUtils from '../utils/banner-utils'
import { BannerConfig } from '../utils/banner-utils'

describe('BannerView', () => {
  const defaultConfig: BannerConfig = {
    message: 'Test banner message',
    id: 'test-banner-1',
    buttonText: 'Click Me',
    buttonUrl: 'https://example.com',
    buttonTarget: '_blank'
  }

  const mockOnDismiss = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  it('renders banner with message', () => {
    render(<BannerView config={defaultConfig} onDismiss={mockOnDismiss} />)
    expect(screen.getByText('Test banner message')).toBeInTheDocument()
  })

  it('renders action button when buttonUrl is valid https', () => {
    render(<BannerView config={defaultConfig} onDismiss={mockOnDismiss} />)
    const button = screen.getByTestId('cfm-banner-button')
    expect(button).toHaveAttribute('href', 'https://example.com')
    expect(button).toHaveAttribute('target', '_blank')
    expect(button).toHaveAttribute('rel', 'noopener noreferrer')
    expect(button).toHaveTextContent('Click Me')
  })

  it('does not render button when buttonUrl is missing', () => {
    const config: BannerConfig = { message: defaultConfig.message, id: defaultConfig.id }
    render(<BannerView config={config} onDismiss={mockOnDismiss} />)
    expect(screen.queryByTestId('cfm-banner-button')).not.toBeInTheDocument()
  })

  it('does not render button when buttonUrl is not https', () => {
    const config = { ...defaultConfig, buttonUrl: 'http://example.com' }
    render(<BannerView config={config} onDismiss={mockOnDismiss} />)
    expect(screen.queryByTestId('cfm-banner-button')).not.toBeInTheDocument()
  })

  it('uses default button text when not provided', () => {
    const config: BannerConfig = {
      message: defaultConfig.message,
      id: defaultConfig.id,
      buttonUrl: defaultConfig.buttonUrl
    }
    render(<BannerView config={config} onDismiss={mockOnDismiss} />)
    expect(screen.getByTestId('cfm-banner-button')).toHaveTextContent('Learn More')
  })

  it('uses custom buttonTarget', () => {
    const config = { ...defaultConfig, buttonTarget: 'codap3' }
    render(<BannerView config={config} onDismiss={mockOnDismiss} />)
    expect(screen.getByTestId('cfm-banner-button')).toHaveAttribute('target', 'codap3')
  })

  it('calls onDismiss when close button clicked', () => {
    render(<BannerView config={defaultConfig} onDismiss={mockOnDismiss} />)
    fireEvent.click(screen.getByTestId('cfm-banner-close'))
    expect(mockOnDismiss).toHaveBeenCalled()
  })

  it('persists dismissal and calls onDismiss when "Don\'t show again" clicked', () => {
    const dismissSpy = jest.spyOn(bannerUtils, 'dismissBanner')
    render(<BannerView config={defaultConfig} onDismiss={mockOnDismiss} />)
    fireEvent.click(screen.getByTestId('cfm-banner-dont-show'))
    expect(dismissSpy).toHaveBeenCalledWith('test-banner-1')
    expect(mockOnDismiss).toHaveBeenCalled()
  })

  it('applies custom colors when valid', () => {
    const config = {
      ...defaultConfig,
      backgroundColor: '#ff0000',
      textColor: '#00ff00'
    }
    render(<BannerView config={config} onDismiss={mockOnDismiss} />)
    const banner = screen.getByTestId('cfm-banner')
    expect(banner).toHaveStyle({ backgroundColor: '#ff0000', color: '#00ff00' })
  })

  it('does not apply invalid colors', () => {
    const config: BannerConfig = {
      ...defaultConfig,
      backgroundColor: 'url(evil)',
      textColor: 'expression(alert(1))'
    }
    render(<BannerView config={config} onDismiss={mockOnDismiss} />)
    const banner = screen.getByTestId('cfm-banner')
    // Invalid colors should not be applied - check that style attribute doesn't contain them
    expect(banner.style.backgroundColor).toBe('')
    expect(banner.style.color).toBe('')
  })

  it('has correct ARIA attributes', () => {
    render(<BannerView config={defaultConfig} onDismiss={mockOnDismiss} />)
    const banner = screen.getByTestId('cfm-banner')
    expect(banner).toHaveAttribute('role', 'status')
    expect(banner).toHaveAttribute('aria-label', 'Announcement')
  })

  it('close button has aria-label', () => {
    render(<BannerView config={defaultConfig} onDismiss={mockOnDismiss} />)
    const closeButton = screen.getByTestId('cfm-banner-close')
    expect(closeButton).toHaveAttribute('aria-label', 'Close announcement')
  })
})
