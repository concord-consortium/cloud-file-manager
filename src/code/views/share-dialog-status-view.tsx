import React from 'react'
import translate from '../utils/translate'

interface IProps {
  isSharing: boolean;
  previewLink: string;
  onToggleShare: (e: React.MouseEvent) => void;
  onUpdateShare: (e: React.MouseEvent) => void;
}
export const ShareDialogStatusView: React.FC<IProps> = ({ isSharing, previewLink, onToggleShare, onUpdateShare }) => {
  return (
    <div>
      <div className='share-status'>
        {translate("~SHARE_DIALOG.SHARE_STATE")}
        <strong>
          {translate(isSharing ? "~SHARE_DIALOG.SHARE_STATE_ENABLED" : "~SHARE_DIALOG.SHARE_STATE_DISABLED")}
          {isSharing &&
            <a href='#' onClick={onToggleShare}>
              {translate("~SHARE_DIALOG.STOP_SHARING")}
            </a>
          }
        </strong>
      </div>
      <div className='share-button'>
        <button onClick={isSharing ? onUpdateShare : onToggleShare}>
          {translate(isSharing ? "~SHARE_DIALOG.UPDATE_SHARING" : "~SHARE_DIALOG.ENABLE_SHARING")}
        </button>
        <div className={isSharing ? 'share-button-help-sharing' : 'share-button-help-not-sharing'}>
          {isSharing
            ? <a href={previewLink} target="_blank" rel="noreferrer">
                {translate("~SHARE_DIALOG.PREVIEW_SHARING")}
              </a>
            : translate("~SHARE_DIALOG.ENABLE_SHARING_MESSAGE")}
        </div>
      </div>
    </div>
  )
}
