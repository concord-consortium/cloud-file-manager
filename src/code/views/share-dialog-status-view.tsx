import React from 'react'
import translate from '../utils/translate'

interface IProps {
  isSharing: boolean
  previewLink: string
  onToggleShare: (e: React.MouseEvent) => void
  onUpdateShare: (e: React.MouseEvent) => void
}
export const ShareDialogStatusView: React.FC<IProps> = ({ isSharing, previewLink, onToggleShare, onUpdateShare }) => {
  return (
    <div>
      <div className='share-status' data-testid='share-status'>
        {translate("~SHARE_DIALOG.SHARE_STATE")}
        <strong>
          {translate(isSharing ? "~SHARE_DIALOG.SHARE_STATE_ENABLED" : "~SHARE_DIALOG.SHARE_STATE_DISABLED")}
        </strong>
      </div>
      <div className='share-buttons'>
        <button onClick={isSharing ? onUpdateShare : onToggleShare} data-testid='share-button-element'>
          {translate(isSharing ? "~SHARE_DIALOG.UPDATE_SHARING" : "~SHARE_DIALOG.ENABLE_SHARING")}
        </button>
        <div className={isSharing ? 'share-button-help-sharing' : 'share-button-help-not-sharing'}>
          {isSharing
            ? <button onClick={() => window.open(previewLink, "_blank")} data-testid='preview-button'>
                {translate("~SHARE_DIALOG.PREVIEW_SHARING")}
              </button>
            : <span>{translate("~SHARE_DIALOG.ENABLE_SHARING_MESSAGE")}</span>
          }
        </div>
        {isSharing &&
          <button onClick={onToggleShare} data-testid="toggle-share-button">
            {translate("~SHARE_DIALOG.STOP_SHARING")}
          </button>
        }
      </div>
    </div>
  )
}
