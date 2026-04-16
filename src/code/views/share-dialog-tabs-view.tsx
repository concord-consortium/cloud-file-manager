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
  testId?: string
}
const SocialIcon = ({ icon, url, testId }: ISocialIconProps) => {
  const socialIcon = (socialIcons as SVGSocialIconMap)[icon]
  return (
    <a className='social-icon' href={url} target='_blank' rel="noreferrer" data-testid={testId}>
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
          ? <button className='copy-button' onClick={onClick} data-testid='cfm-dialog-share-copy-button'>
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
    <div data-testid='cfm-dialog-share-embed-contents'>
      {translate("~SHARE_DIALOG.EMBED_MESSAGE")}
      <div className="share-url-container">
        <textarea
          value={url || ""}
          readOnly={true}
          data-testid="cfm-dialog-share-embed-textarea"
        />
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
    <div className={mode} data-testid='cfm-dialog-share-api-contents'>
      {translate(mode === 'lara' ? '~SHARE_DIALOG.LARA_MESSAGE' : '~SHARE_DIALOG.INTERACTIVE_API_MESSAGE')}
      <div className="share-url-container">
        <input
          value={linkUrl}
          readOnly={true}
          data-testid="cfm-dialog-share-api-link-input"
        />
        <CopyButton onClick={onCopyClick}/>
      </div>
      <div className='lara-api-settings'>
        <div className='codap-server-url'>
          {serverUrlLabel}
          <div>
            <input value={serverUrl || ""} data-testid='cfm-dialog-share-server-url-input' onChange={onChangeServerUrl} />
          </div>
        </div>
        <div className='fullscreen-scaling'>
          <input type='checkbox' data-testid='cfm-dialog-share-fullscreen-checkbox'
            checked={fullscreenScaling} onChange={onChangeFullscreenScaling} />
          {translate("~SHARE_DIALOG.LARA_FULLSCREEN_BUTTON_AND_SCALING")}
        </div>
        <div className='visibility-toggles'>
          <input type='checkbox' data-testid='cfm-dialog-share-visibility-checkbox'
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
    <div data-testid='cfm-dialog-share-link-contents'>
      {translate("~SHARE_DIALOG.LINK_MESSAGE")}
      <div className="share-url-container">
        <input
          value={url || ""}
          readOnly={true}
          data-testid="cfm-dialog-share-link-url-input"
        />
        <CopyButton onClick={onCopyClick} />
      </div>
      <div className='social-icons' data-testid='cfm-dialog-share-social'>
        <SocialIcon icon='facebook' url={facebookUrl} testId='cfm-dialog-share-social-facebook' />
        <SocialIcon icon='twitter' url={twitterUrl} testId='cfm-dialog-share-social-twitter' />
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
  const tabs: { id: ShareDialogTab, label: string, testId: string }[] = [
    { id: 'link', label: translate("~SHARE_DIALOG.LINK_TAB"), testId: 'cfm-dialog-share-tab-link' },
    { id: 'embed', label: translate("~SHARE_DIALOG.EMBED_TAB"), testId: 'cfm-dialog-share-tab-embed' },
  ]
  if (interactiveApi) {
    tabs.push({ id: 'api', label: 'Activity Player', testId: 'cfm-dialog-share-tab-api' })
  }

  const handleTabKeyDown = (e: React.KeyboardEvent, tab: ShareDialogTab) => {
    const currentIndex = tabs.findIndex(t => t.id === tab)
    let newIndex = -1

    if (e.key === 'ArrowRight') {
      newIndex = (currentIndex + 1) % tabs.length
    } else if (e.key === 'ArrowLeft') {
      newIndex = (currentIndex - 1 + tabs.length) % tabs.length
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelectTab(tab)
      return
    }

    if (newIndex >= 0) {
      e.preventDefault()
      onSelectTab(tabs[newIndex].id)
      const tabEl = document.querySelector(`[data-testid='${tabs[newIndex].testId}']`) as HTMLElement
      tabEl?.focus()
    }
  }

  return (
    <div data-testid='cfm-dialog-share-tabs-container'>
      <ul className='sharing-tabs' role='tablist'>
        {tabs.map((tab) => (
          <li key={tab.id}
            id={`${tab.id}-tab`}
            aria-controls={`${tab.id}-tabpanel`}
            aria-selected={tabSelected === tab.id}
            className={classNames('sharing-tab', `sharing-tab-${tab.id}`, { 'sharing-tab-selected': tabSelected === tab.id })}
            data-testid={tab.testId}
            role='tab'
            tabIndex={tabSelected === tab.id ? 0 : -1}
            onClick={() => onSelectTab(tab.id)}
            onKeyDown={(e) => handleTabKeyDown(e, tab.id)}
          >
            {tab.label}
          </li>
        ))}
      </ul>
      <div id={`${tabSelected}-tabpanel`} className="sharing-tab-contents" role="tabpanel"
           aria-labelledby={`${tabSelected}-tab`} tabIndex={0}>
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
