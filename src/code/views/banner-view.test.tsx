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

  it('applies custom button colors when valid', () => {
    const config = {
      ...defaultConfig,
      buttonBackgroundColor: '#333333',
      buttonTextColor: '#ffffff'
    }
    render(<BannerView config={config} onDismiss={mockOnDismiss} />)
    const button = screen.getByTestId('cfm-banner-button')
    expect(button).toHaveStyle({ backgroundColor: '#333333', color: '#ffffff' })
  })

  it('applies custom close button color when valid', () => {
    const config = {
      ...defaultConfig,
      closeButtonColor: '#444444'
    }
    render(<BannerView config={config} onDismiss={mockOnDismiss} />)
    const closeButton = screen.getByTestId('cfm-banner-close')
    const dontShowButton = screen.getByTestId('cfm-banner-dont-show')
    expect(closeButton).toHaveStyle({ color: '#444444', borderColor: '#444444' })
    expect(dontShowButton).toHaveStyle({ color: '#444444', borderColor: '#444444' })
  })

  it('does not apply invalid button colors', () => {
    const config: BannerConfig = {
      ...defaultConfig,
      buttonBackgroundColor: 'url(evil)',
      buttonTextColor: 'expression(alert(1))',
      closeButtonColor: '<script>bad</script>'
    }
    render(<BannerView config={config} onDismiss={mockOnDismiss} />)
    const button = screen.getByTestId('cfm-banner-button')
    const closeButton = screen.getByTestId('cfm-banner-close')
    expect(button.style.backgroundColor).toBe('')
    expect(button.style.color).toBe('')
    expect(closeButton.style.color).toBe('')
    expect(closeButton.style.borderColor).toBe('')
  })

  it('applies custom padding when valid', () => {
    const config = {
      ...defaultConfig,
      paddingX: 20,
      paddingY: 8
    }
    render(<BannerView config={config} onDismiss={mockOnDismiss} />)
    const banner = screen.getByTestId('cfm-banner')
    expect(banner).toHaveStyle({
      paddingTop: '8px',
      paddingBottom: '8px',
      paddingLeft: '20px',
      paddingRight: '20px'
    })
  })

  it('does not apply invalid padding values', () => {
    const config = {
      ...defaultConfig,
      paddingX: -10,
      paddingY: NaN
    }
    render(<BannerView config={config} onDismiss={mockOnDismiss} />)
    const banner = screen.getByTestId('cfm-banner')
    expect(banner.style.paddingTop).toBe('')
    expect(banner.style.paddingLeft).toBe('')
  })

  it('applies custom button padding when valid', () => {
    const config = {
      ...defaultConfig,
      buttonPaddingX: 10,
      buttonPaddingY: 5
    }
    render(<BannerView config={config} onDismiss={mockOnDismiss} />)
    const button = screen.getByTestId('cfm-banner-button')
    const dontShowButton = screen.getByTestId('cfm-banner-dont-show')
    expect(button).toHaveStyle({
      paddingTop: '5px',
      paddingBottom: '5px',
      paddingLeft: '10px',
      paddingRight: '10px'
    })
    expect(dontShowButton).toHaveStyle({
      paddingTop: '5px',
      paddingBottom: '5px',
      paddingLeft: '10px',
      paddingRight: '10px'
    })
  })

  it('does not apply invalid button padding values', () => {
    const config = {
      ...defaultConfig,
      buttonPaddingX: -5,
      buttonPaddingY: Infinity
    }
    render(<BannerView config={config} onDismiss={mockOnDismiss} />)
    const button = screen.getByTestId('cfm-banner-button')
    expect(button.style.paddingTop).toBe('')
    expect(button.style.paddingLeft).toBe('')
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
