import classNames from 'classnames'
import React from 'react'
import socialIcons from 'svg-social-icons/lib/icons.json'
import translate from '../utils/translate'

interface SVGSocialIcon {
  icon: string   // SVG icon path string
  mask: string   // SVG mask path string
  color: string
}
type SVGSocialIconMap = Record<string, SVGSocialIcon>

interface ISocialIconProps {
  icon: string
  url: string
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
  onClick: (e: React.MouseEvent) => void
}
const CopyButton = ({ onClick }: ICopyAnchorLinkProps) => {
  return document.execCommand || (window as any).clipboardData
          ? <button className='copy-button' onClick={onClick} data-testid='copy-button'>
              {translate('~SHARE_DIALOG.COPY')}
            </button>
          : null
}

interface IEmbedTabProps {
  url: string
  onCopyClick: (e: React.MouseEvent) => void
}
export const EmbedTabContents: React.FC<IEmbedTabProps> = ({ url, onCopyClick }) => {
  return (
    <div data-testid='embed-tab-contents'>
      {translate("~SHARE_DIALOG.EMBED_MESSAGE")}
      <div className="share-url-container">
        <textarea value={url || ""} readOnly={true} />
        <CopyButton onClick={onCopyClick} />
      </div>
    </div>
  )
}

export interface ILaraApiTabProps {
  mode: 'lara' | 'api'
  linkUrl: string
  serverUrlLabel: string
  serverUrl: string
  fullscreenScaling?: boolean
  visibilityToggles?: boolean
  onCopyClick: (e: React.MouseEvent) => void
  onChangeServerUrl: (e: React.ChangeEvent<HTMLInputElement>) => void
  onChangeFullscreenScaling?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onChangeVisibilityToggles?: (e: React.ChangeEvent<HTMLInputElement>) => void
}
export const LaraApiTabContents: React.FC<ILaraApiTabProps> = ({
        mode, linkUrl, serverUrlLabel, serverUrl, fullscreenScaling, visibilityToggles,
        onCopyClick, onChangeServerUrl, onChangeFullscreenScaling, onChangeVisibilityToggles
}) => {
  return (
    <div className={mode} data-testid='lara-api-tab-contents'>
      {translate(mode === 'lara' ? '~SHARE_DIALOG.LARA_MESSAGE' : '~SHARE_DIALOG.INTERACTIVE_API_MESSAGE')}
      <div className="share-url-container">
        <input value={linkUrl} readOnly={true} />
        <CopyButton onClick={onCopyClick}/>
      </div>
      <div className='lara-api-settings'>
        <div className='codap-server-url'>
          {serverUrlLabel}
          <div>
            <input value={serverUrl || ""} data-testid='server-url-input' onChange={onChangeServerUrl} />
          </div>
        </div>
        <div className='fullscreen-scaling'>
          <input type='checkbox' data-testid='fullscreen-scaling-checkbox'
            checked={fullscreenScaling} onChange={onChangeFullscreenScaling} />
          {translate("~SHARE_DIALOG.LARA_FULLSCREEN_BUTTON_AND_SCALING")}
        </div>
        <div className='visibility-toggles'>
          <input type='checkbox' data-testid='visibility-toggles-checkbox'
            checked={visibilityToggles} onChange={onChangeVisibilityToggles} />
          {translate("~SHARE_DIALOG.LARA_DISPLAY_VISIBILITY_TOGGLES")}
        </div>
      </div>
    </div>
  )
}

interface ILinkTabProps {
  url: string
  onCopyClick: (e: React.MouseEvent) => void
}
export const LinkTabContents: React.FC<ILinkTabProps> = ({ url, onCopyClick }) => {
  const encodedUrl = encodeURIComponent(url)
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
  const twitterUrl = `https://twitter.com/home?status=${encodedUrl}`
  // not working: googleUrl = `https://plus.google.com/share?url=${url}`
  return (
    <div data-testid='link-tab-contents'>
      {translate("~SHARE_DIALOG.LINK_MESSAGE")}
      <div className="share-url-container">
        <input value={url || ""} readOnly={true} />
        <CopyButton onClick={onCopyClick} />
      </div>
      <div className='social-icons'>
        <SocialIcon icon='facebook' url={facebookUrl} />
        <SocialIcon icon='twitter' url={twitterUrl} />
      </div>
    </div>
  )
}

export type ShareDialogTab = 'api' | 'embed' | 'lara' | 'link'
export interface IShareDialogLaraApiTabProps {
  linkUrl: string
  serverUrlLabel: string
  serverUrl: string
  onChangeServerUrl: (e: React.ChangeEvent<HTMLInputElement>) => void
}
interface IShareDialogTabsProps {
  tabSelected: ShareDialogTab
  linkUrl: string
  embedUrl: string
  interactiveApi?: IShareDialogLaraApiTabProps
  fullscreenScaling?: boolean
  visibilityToggles?: boolean
  onChangeFullscreenScaling?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onChangeVisibilityToggles?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSelectTab: (tab: ShareDialogTab) => void
  onCopyClick: (e: React.MouseEvent) => void
}
export const ShareDialogTabsView: React.FC<IShareDialogTabsProps> = ({
              tabSelected, embedUrl, linkUrl, interactiveApi, onSelectTab, onCopyClick, ...others
}) => {
  return (
    <div data-testid='share-dialog-tabs-view'>
      <ul className='sharing-tabs'>
        <li className={classNames('sharing-tab', 'sharing-tab-link', { 'sharing-tab-selected': tabSelected === 'link' })}
            style={{ marginLeft: 10 }} onClick={() => onSelectTab('link')} data-testid='sharing-tab-link'>
          {translate("~SHARE_DIALOG.LINK_TAB")}
        </li>
        <li className={classNames('sharing-tab', 'sharing-tab-embed', { 'sharing-tab-selected': tabSelected === 'embed' })}
            onClick={() => onSelectTab('embed')} data-testid='sharing-tab-embed'>
          {translate("~SHARE_DIALOG.EMBED_TAB")}
        </li>
        {interactiveApi &&
          <li className={classNames('sharing-tab', 'sharing-tab-api', { 'sharing-tab-selected': tabSelected === 'api' })}
              onClick={() => onSelectTab('api')} data-testid='sharing-tab-api'>
            Activity Player
          </li>}
      </ul>
      <div className="sharing-tab-contents">
        {(() => {
          switch (tabSelected) {
            case 'link':
              return <LinkTabContents url={linkUrl} onCopyClick={onCopyClick} />
            case 'embed':
              return <EmbedTabContents url={embedUrl} onCopyClick={onCopyClick} />
            case 'api': {
              const { linkUrl: url, ...apiOthers } = interactiveApi
              return <LaraApiTabContents mode='api' linkUrl={url} onCopyClick={onCopyClick}
                                        {...others} {...apiOthers} />
            }
            default:
              return null
          }
        })()}
      </div>
    </div>
  )
}
