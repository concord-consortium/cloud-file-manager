import React from 'react'
import { BannerConfig, dismissBanner, isValidButtonUrl, isValidCssColor } from '../utils/banner-utils'

interface IBannerViewProps {
  config: BannerConfig
  onDismiss: () => void
}

/**
 * Stateless banner component - visibility is controlled by parent via onDismiss.
 */
export const BannerView: React.FC<IBannerViewProps> = ({ config, onDismiss }) => {
  const {
    message,
    id,
    buttonText = 'Learn More',
    buttonUrl,
    buttonTarget = '_blank',
    backgroundColor,
    textColor,
    buttonBackgroundColor,
    buttonTextColor,
    closeButtonColor,
    paddingX,
    paddingY,
    buttonPaddingX,
    buttonPaddingY
  } = config

  const showButton = isValidButtonUrl(buttonUrl)

  const handleClose = () => {
    onDismiss()
  }

  const handleDontShowAgain = () => {
    dismissBanner(id)
    onDismiss()
  }

  // Validate colors to prevent CSS injection
  const customStyles: React.CSSProperties = {}
  if (isValidCssColor(backgroundColor)) customStyles.backgroundColor = backgroundColor
  if (isValidCssColor(textColor)) customStyles.color = textColor

  // Apply custom padding (numbers only, converted to px)
  if (typeof paddingY === 'number' && Number.isFinite(paddingY) && paddingY >= 0) {
    customStyles.paddingTop = paddingY
    customStyles.paddingBottom = paddingY
  }
  if (typeof paddingX === 'number' && Number.isFinite(paddingX) && paddingX >= 0) {
    customStyles.paddingLeft = paddingX
    customStyles.paddingRight = paddingX
  }

  // Button styles
  const buttonStyles: React.CSSProperties = {}
  if (isValidCssColor(buttonBackgroundColor)) buttonStyles.backgroundColor = buttonBackgroundColor
  if (isValidCssColor(buttonTextColor)) buttonStyles.color = buttonTextColor
  if (typeof buttonPaddingY === 'number' && Number.isFinite(buttonPaddingY) && buttonPaddingY >= 0) {
    buttonStyles.paddingTop = buttonPaddingY
    buttonStyles.paddingBottom = buttonPaddingY
  }
  if (typeof buttonPaddingX === 'number' && Number.isFinite(buttonPaddingX) && buttonPaddingX >= 0) {
    buttonStyles.paddingLeft = buttonPaddingX
    buttonStyles.paddingRight = buttonPaddingX
  }

  // Close button and "Don't show again" button styles
  const closeStyles: React.CSSProperties = {}
  if (isValidCssColor(closeButtonColor)) {
    closeStyles.color = closeButtonColor
    closeStyles.borderColor = closeButtonColor
  }
  if (typeof buttonPaddingY === 'number' && Number.isFinite(buttonPaddingY) && buttonPaddingY >= 0) {
    closeStyles.paddingTop = buttonPaddingY
    closeStyles.paddingBottom = buttonPaddingY
  }
  if (typeof buttonPaddingX === 'number' && Number.isFinite(buttonPaddingX) && buttonPaddingX >= 0) {
    closeStyles.paddingLeft = buttonPaddingX
    closeStyles.paddingRight = buttonPaddingX
  }

  return (
    <div
      className="cfm-banner"
      role="status"
      aria-label="Announcement"
      style={customStyles}
      data-testid="cfm-banner"
    >
      <span className="cfm-banner-message">{message}</span>

      <div className="cfm-banner-actions">
        {showButton && (
          <a
            href={buttonUrl}
            target={buttonTarget}
            rel="noopener noreferrer"
            className="cfm-banner-button"
            style={buttonStyles}
            data-testid="cfm-banner-button"
          >
            {buttonText}
          </a>
        )}

        <button
          type="button"
          className="cfm-banner-dont-show"
          style={closeStyles}
          onClick={handleDontShowAgain}
          data-testid="cfm-banner-dont-show"
        >
          Don&apos;t show again
        </button>

        <button
          type="button"
          className="cfm-banner-close"
          style={closeStyles}
          onClick={handleClose}
          aria-label="Close announcement"
          data-testid="cfm-banner-close"
        >
          &times;
        </button>
      </div>
    </div>
  )
}
