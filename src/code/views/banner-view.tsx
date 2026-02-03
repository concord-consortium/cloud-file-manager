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
    textColor
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
            data-testid="cfm-banner-button"
          >
            {buttonText}
          </a>
        )}

        <button
          type="button"
          className="cfm-banner-dont-show"
          onClick={handleDontShowAgain}
          data-testid="cfm-banner-dont-show"
        >
          Don&apos;t show again
        </button>

        <button
          type="button"
          className="cfm-banner-close"
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
