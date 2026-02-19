import React from 'react'
import {
  BannerConfig, dismissBanner, isPositiveNumber, isValidButtonUrl, isValidCssColor, parseMessageWithLinks
} from '../utils/banner-utils'

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
    linkColor,
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
  if (isPositiveNumber(paddingY)) {
    customStyles.paddingTop = paddingY
    customStyles.paddingBottom = paddingY
  }
  if (isPositiveNumber(paddingX)) {
    customStyles.paddingLeft = paddingX
    customStyles.paddingRight = paddingX
  }

  // Button styles
  const buttonStyles: React.CSSProperties = {}
  if (isValidCssColor(buttonBackgroundColor)) buttonStyles.backgroundColor = buttonBackgroundColor
  if (isValidCssColor(buttonTextColor)) buttonStyles.color = buttonTextColor
  if (isPositiveNumber(buttonPaddingY)) {
    buttonStyles.paddingTop = buttonPaddingY
    buttonStyles.paddingBottom = buttonPaddingY
  }
  if (isPositiveNumber(buttonPaddingX)) {
    buttonStyles.paddingLeft = buttonPaddingX
    buttonStyles.paddingRight = buttonPaddingX
  }

  // Close button and "Don't show again" button styles
  const closeStyles: React.CSSProperties = {}
  if (isValidCssColor(closeButtonColor)) {
    closeStyles.color = closeButtonColor
    closeStyles.borderColor = closeButtonColor
  }
  if (isPositiveNumber(buttonPaddingY)) {
    closeStyles.paddingTop = buttonPaddingY
    closeStyles.paddingBottom = buttonPaddingY
  }
  if (isPositiveNumber(buttonPaddingX)) {
    closeStyles.paddingLeft = buttonPaddingX
    closeStyles.paddingRight = buttonPaddingX
  }

  // Link styles
  const linkStyles: React.CSSProperties = {}
  if (isValidCssColor(linkColor)) linkStyles.color = linkColor

  return (
    <div
      className="cfm-banner"
      role="status"
      aria-label="Announcement"
      style={customStyles}
      data-testid="cfm-banner"
    >
      <span className="cfm-banner-message">
        {parseMessageWithLinks(message).map((segment, i) =>
          segment.url
            ? <a key={i} href={segment.url} target="_blank"
                rel="noopener noreferrer" style={linkStyles}>{segment.text}</a>
            : segment.text
        )}
      </span>

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
