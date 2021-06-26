import classNames from 'classnames'
import React from 'react'
import socialIcons from 'svg-social-icons/lib/icons.json'
import translate from '../utils/translate'

interface SVGSocialIcon {
  icon: string;   // SVG icon path string
  mask: string;   // SVG mask path string
  color: string;
}
type SVGSocialIconMap = Record<string, SVGSocialIcon>

interface ISocialIconProps {
  icon: string;
  url: string;
}
const SocialIcon = ({ icon, url }: ISocialIconProps) => {
  const socialIcon = (socialIcons as SVGSocialIconMap)[icon]
  return (
    <a className='social-icon' href={url} target='_blank' rel="noreferrer">
      <div className='social-container'>
        <svg className='social-svg' viewBox='0 0 64 64'>
          <g className='social-svg-background'>
            <circle cx={32} cy={32} r={31} />
          </g>
          <g className='social-svg-icon'>
            <path d={socialIcon.icon} />
          </g>
          <g className='social-svg-mask' style={{ fill: socialIcon.color }}>
            <path d={socialIcon.mask} />
          </g>
        </svg>
      </div>
    </a>
  )
}

interface ICopyAnchorLinkProps {
  onClick: (e: React.MouseEvent) => void;
}
const CopyAnchorLink = ({ onClick }: ICopyAnchorLinkProps) => {
  return document.execCommand || (window as any).clipboardData
          ? <a className='copy-link' href='#' onClick={onClick}>
              {translate('~SHARE_DIALOG.COPY')}
            </a>
          : null
}

interface IEmbedTabProps {
  url: string;
  onCopyClick: (e: React.MouseEvent) => void;
}
export const EmbedTabContents: React.FC<IEmbedTabProps> = ({ url, onCopyClick }) => {
  return (
    <div>
      {translate("~SHARE_DIALOG.EMBED_MESSAGE")}
      <CopyAnchorLink onClick={onCopyClick} />
      <div>
        <textarea value={url} readOnly={true} />
      </div>
    </div>
  )
}

interface ILaraTabProps {
  serverUrlLabel: string;
  serverUrl: string;
  fullscreenScaling: boolean;
  visibilityToggles: boolean;
  url: string;
  onCopyClick: (e: React.MouseEvent) => void;
  onChangeServerUrl: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeFullscreenScaling: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeVisibilityToggles: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
export const LaraTabContents: React.FC<ILaraTabProps> = ({
        serverUrlLabel, serverUrl, fullscreenScaling, visibilityToggles, url,
        onCopyClick, onChangeServerUrl, onChangeFullscreenScaling, onChangeVisibilityToggles
}) => {
  return (
    <div>
      {translate("~SHARE_DIALOG.LARA_MESSAGE")}
      <CopyAnchorLink onClick={onCopyClick} />
      <div>
        <input value={url} readOnly={true} />
      </div>
      <div className='lara-settings'>
        <div className='codap-server-url'>
          {serverUrlLabel}
          <div>
            <input value={serverUrl} onChange={onChangeServerUrl} />
          </div>
        </div>
        <div className='fullscreen-scaling'>
          <input type='checkbox' checked={fullscreenScaling} onChange={onChangeFullscreenScaling} />
          {translate("~SHARE_DIALOG.LARA_FULLSCREEN_BUTTON_AND_SCALING")}
        </div>
        <div>
          <input type='checkbox' checked={visibilityToggles} onChange={onChangeVisibilityToggles} />
          {translate("~SHARE_DIALOG.LARA_DISPLAY_VISIBILITY_TOGGLES")}
        </div>
      </div>
    </div>
  )
}

interface ILinkTabProps {
  url: string;
  onCopyClick: (e: React.MouseEvent) => void;
}
export const LinkTabContents: React.FC<ILinkTabProps> = ({ url, onCopyClick }) => {
  const encodedUrl = encodeURIComponent(url)
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
  const twitterUrl = `https://twitter.com/home?status=${encodedUrl}`
  // not working: googleUrl = `https://plus.google.com/share?url=${url}`
  return (
    <div>
      {translate("~SHARE_DIALOG.LINK_MESSAGE")}
      <CopyAnchorLink onClick={onCopyClick} />
      <div>
        <input value={url} readOnly={true} />
      </div>
      <div className='social-icons'>
        <SocialIcon icon='facebook' url={facebookUrl} />
        <SocialIcon icon='twitter' url={twitterUrl} />
      </div>
    </div>
  )
}

interface IShareDialogLaraTabProps {
  enableLaraSharing?: boolean;
  url: string;
  serverUrlLabel: string;
  serverUrl: string;
  fullscreenScaling: boolean;
  visibilityToggles: boolean;
  onChangeServerUrl: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeFullscreenScaling: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeVisibilityToggles: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
interface IShareDialogTabsProps {
  tabSelected: 'embed' | 'lara' | 'link';
  linkUrl: string;
  embedUrl: string;
  lara: IShareDialogLaraTabProps;
  onSelectLinkTab: () => void;
  onSelectEmbedTab: () => void;
  onSelectLaraTab: () => void;
  onCopyClick: (e: React.MouseEvent) => void;
}
export const ShareDialogTabsView: React.FC<IShareDialogTabsProps> = ({
              tabSelected, embedUrl, linkUrl, lara,
              onSelectLinkTab, onSelectEmbedTab, onSelectLaraTab, onCopyClick
}) => {
  const { enableLaraSharing, url: laraUrl, ...laraProps } = lara
  return (
    <div>
      <ul className='sharing-tabs'>
        <li className={classNames('sharing-tab', 'sharing-tab-link', { 'sharing-tab-selected': tabSelected === 'link' })}
            style={{ marginLeft: 10 }} onClick={onSelectLinkTab} >
          {translate("~SHARE_DIALOG.LINK_TAB")}
        </li>
        <li className={classNames('sharing-tab', 'sharing-tab-embed', { 'sharing-tab-selected': tabSelected === 'embed' })}
            onClick={onSelectEmbedTab} >
          {translate("~SHARE_DIALOG.EMBED_TAB")}
        </li>
        {enableLaraSharing &&
          <li className={classNames('sharing-tab', 'sharing-tab-lara', { 'sharing-tab-selected': tabSelected === 'lara' })}
              onClick={onSelectLaraTab} >
            LARA
          </li>}
      </ul>
      <div className="sharing-tab-contents">
        {(() => {
          switch (tabSelected) {
            case 'link':
              return LinkTabContents({ url: linkUrl, onCopyClick })
            case 'embed':
              return EmbedTabContents({ url: embedUrl, onCopyClick })
            case 'lara':
              return LaraTabContents({ url: laraUrl, onCopyClick, ...laraProps })
            default:
              return null
          }
        })()}
      </div>
    </div>
  )
}
