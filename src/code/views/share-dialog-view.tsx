import React from 'react'

const SHOW_LONGEVITY_WARNING = false

import ModalDialogView from './modal-dialog-view'
import {ShareLoadingView} from './share-loading-view'
import { ShareDialogStatusView } from './share-dialog-status-view'
import { ShareDialogTab, ShareDialogTabsView } from './share-dialog-tabs-view'
import translate from '../utils/translate'

const CFM_PRODUCTION_URL = "https://cloud-file-manager.concord.org"
const CFM_PRODUCTION_AUTOLAUNCH_URL = `${CFM_PRODUCTION_URL}/autolaunch/autolaunch.html`
const CODAP_PRODUCTION_URL = "https://codap.concord.org/releases/latest/"

const FULLSCREEN_INTERACTIVE_URL = "https://models-resources.concord.org/question-interactives/version/v1.6.0/full-screen/?wrappedInteractive="

interface IShareDialogPropsSettings {
  serverUrl?: string;
  serverUrlLabel?: string;
}
interface IShareDialogProps {
  currentBaseUrl: string;
  isShared: boolean;
  sharedDocumentId?: string;  // to support legacy shares
  sharedDocumentUrl?: string;
  settings?: IShareDialogPropsSettings;
  enableLaraSharing?: boolean;
  onAlert: (message: string, title?: string) => void;
  onToggleShare: (callback: (err: string | null, sharedContentId?: string) => void) => void;
  onUpdateShare: () => void;
  close: () => void;
}
interface IShareDialogState {
  link: string | null;
  embed: string | null;
  laraServerUrl: string;
  laraServerUrlLabel: string;
  interactiveApiServerUrl: string;
  interactiveApiServerUrlLabel: string;
  fullscreenScaling: boolean;
  graphVisToggles: boolean;
  tabSelected: ShareDialogTab;
  isLoadingShared: boolean;
}

export default class ShareDialogView extends React.Component<IShareDialogProps, IShareDialogState> {

  state: IShareDialogState

  constructor(props: IShareDialogProps) {
    super(props)

    this.state = {
      link: this.getShareLink(),
      embed: this.getEmbed(),
      laraServerUrl: this.props.settings?.serverUrl || CODAP_PRODUCTION_URL,
      laraServerUrlLabel: this.props.settings?.serverUrlLabel || translate("~SHARE_DIALOG.LARA_CODAP_URL"),
      interactiveApiServerUrl: this.props.currentBaseUrl,
      interactiveApiServerUrlLabel: 'Server URL',
      fullscreenScaling: true,
      graphVisToggles: false,
      tabSelected: 'link',
      isLoadingShared: false
    }
  }

  // Get a documentID, or going forward, always return a URL to a document
  getShareUrl() {
    const { isShared, sharedDocumentId, sharedDocumentUrl } = this.props
    if (isShared) {
      if(sharedDocumentUrl) {
        return sharedDocumentUrl
      }
      // 2020-07-20 NP: We still need to support simple numeric IDs for now
      // in the future we can convert w getLegacyUrl(sharedDocumentId)
      if(sharedDocumentId) {
        return sharedDocumentId
      }
    }
    return null
  }

  // Return a sharable link to this document (includes the app CODAP)
  getShareLink() {
    const shareRef = this.getShareUrl()
    if (shareRef) {
      return `${this.props.currentBaseUrl}#shared=${encodeURIComponent(shareRef)}`
    }
    return null
  }

  getEmbed() {
    if (this.getShareLink()) {
      return `<iframe width="398px" height="313px" frameborder="no" scrolling="no" allowfullscreen="true" webkitallowfullscreen="true" mozallowfullscreen="true" src="${this.getShareLink()}"></iframe>`
    } else {
      return null
    }
  }

  getEncodedServerUrl(serverUrl: string) {
    // graphVisToggles is a parameter handled by CODAP, so it needs to be added to its URL.
    const delimiter = serverUrl.includes('?') ? '&' : '?'
    const togglesParam = this.state.graphVisToggles ? 'app=is' : ''
    return encodeURIComponent(`${serverUrl}${delimiter}${togglesParam}`)
  }

  getLara() {
    // Update the LARA share link as per this story:
    // https://www.pivotaltracker.com/story/show/172302663
    //
    // General form of the link is:
    //  `<AutoLaunchPageUrl>?documentId=<XX>&server=<CODAP SERVER>&scaling`
    // <AutoLaunchPageUrl> expects a `documentId` param (was a path in DocStore)
    //    and a `server` param, that points usually to some CODAP release.
    // <CODAP SERVER> can have url encoded params too such as `FcfmBaseUrl=`
    // where URL is the url to the /js folder for CFM
    //
    // It will point to SPA hosted in this repo -- NP 2020-06-29
    //  1: Get the resource URL (S3 shared document public URL)
    //  2: Get the URL for the autoLaunch page (hosted here ...)
    //  3: Construct a URL to <AutolaunchPage
    const documentId = encodeURIComponent(this.getShareUrl())
    const server = this.getEncodedServerUrl(this.state.laraServerUrl)
    // Other params are handled by document server itself:
    const fullscreenScaling = this.state.fullscreenScaling ? '&scaling' : ''

    return `${CFM_PRODUCTION_AUTOLAUNCH_URL}?documentId=${documentId}&server=${server}${fullscreenScaling}`
  }
  // TODO: Consider using queryparams to make URL construction less janky⬆

  getInteractiveApiLink() {
    const documentId = encodeURIComponent(this.getShareUrl())
    const separator = this.state.interactiveApiServerUrl.includes('?') ? '&' : '?'
    const togglesParam = this.state.graphVisToggles ? 'app=is&' : ''
    let url = `${this.state.interactiveApiServerUrl}${separator}${togglesParam}interactiveApi&documentId=${documentId}`
    if (this.state.fullscreenScaling) {
      url = FULLSCREEN_INTERACTIVE_URL + encodeURIComponent(url)
    }
    return url
  }

  // adapted from https://github.com/sudodoki/copy-to-clipboard/blob/master/index.js
  copy = (e: any) => {
    let mark, range, selection
    e.preventDefault()
    let copied = false
    const toCopy = (() => { switch (this.state.tabSelected) {
      case 'embed': return this.getEmbed()
      case 'link': return this.getShareLink()
      case 'lara': return this.getLara()
      case 'api': return this.getInteractiveApiLink()
    } })()
    try {
      mark = document.createElement('mark')
      mark.textContent = toCopy
      // reset user styles for span element
      mark.style.all = 'unset'
      // prevents scrolling to the end of the page
      mark.style.position = 'fixed'
      mark.style.top = '0'
      mark.style.clip = 'rect(0, 0, 0, 0)'
      // used to preserve spaces and line breaks
      mark.style.whiteSpace = 'pre'
      // do not inherit user-select (it may be `none`)
      mark.style.webkitUserSelect = 'text';
      (mark.style as any).MozUserSelect = 'text';
      (mark.style as any).msUserSelect = 'text'
      mark.style.userSelect = 'text'
      document.body.appendChild(mark)

      selection = document.getSelection()
      selection.removeAllRanges()

      range = document.createRange()
      range.selectNode(mark)
      selection.addRange(range)

      return copied = document.execCommand('copy')
    } catch (error) {
      try {
        (window as any).clipboardData.setData('text', toCopy)
        return copied = true
      } catch (error1) {
        return copied = false
      }
    }
    finally {
      if (selection) {
        if (typeof selection.removeRange === 'function') {
          selection.removeRange(range)
        } else {
          selection.removeAllRanges()
        }
      }
      if (mark) {
        document.body.removeChild(mark)
      }
      this.props.onAlert(translate(copied ? "~SHARE_DIALOG.COPY_SUCCESS" : "~SHARE_DIALOG.COPY_ERROR"),
                          translate("~SHARE_DIALOG.COPY_TITLE"))
    }
  }

  updateShare = () => {
    return this.props.onUpdateShare()
  }

  toggleShare = (e: React.MouseEvent) => {
    e.preventDefault()
    this.setState({
      isLoadingShared: true
    })
    return this.props.onToggleShare(() => {
      return this.setState({
        link: this.getShareLink(),
        embed: this.getEmbed(),
        isLoadingShared: false
      })
    })
  }

  selectShareTab = (tab: ShareDialogTab) => {
    this.setState({ tabSelected: tab })
  }

  changedLaraServerUrl = (event: React.ChangeEvent<HTMLInputElement>) => {
    return this.setState({laraServerUrl: event.target.value})
  }

  changedInteractiveApiServerUrl = (event: React.ChangeEvent<HTMLInputElement>) => {
    return this.setState({interactiveApiServerUrl: event.target.value})
  }

  changedFullscreenScaling = (event: React.ChangeEvent<HTMLInputElement>) => {
    return this.setState({fullscreenScaling: event.target.checked})
  }

  changedGraphVisToggles = (event: React.ChangeEvent<HTMLInputElement>) => {
    return this.setState({graphVisToggles: event.target.checked})
  }

  render() {
    const { isShared } = this.props
    const { isLoadingShared, link } = this.state
    const sharing = isShared || (link != null)
    return (
      <ModalDialogView title={translate('~DIALOG.SHARED')} close={this.props.close}>
        <div className='share-dialog' data-testid='share-dialog'>
          <div className='share-top-dialog'>
            {isLoadingShared
              ? <ShareLoadingView />
              : <ShareDialogStatusView isSharing={sharing} previewLink={this.state.link}
                  onToggleShare={this.toggleShare} onUpdateShare={this.updateShare}/>}
          </div>

          {sharing &&
            <ShareDialogTabsView
              tabSelected={this.state.tabSelected}
              linkUrl={this.state.link}
              embedUrl={this.state.embed}
              lara={this.props.enableLaraSharing
                ? {
                    linkUrl: this.getLara(),
                    serverUrlLabel: this.state.laraServerUrlLabel,
                    serverUrl: this.state.laraServerUrl,
                    onChangeServerUrl: this.changedLaraServerUrl
                  }
                : undefined}
              interactiveApi={this.props.enableLaraSharing
                ? {
                    linkUrl: this.getInteractiveApiLink(),
                    serverUrlLabel: this.state.interactiveApiServerUrlLabel,
                    serverUrl: this.state.interactiveApiServerUrl,
                    onChangeServerUrl: this.changedInteractiveApiServerUrl
                  }
                : undefined}
              fullscreenScaling={this.state.fullscreenScaling}
              visibilityToggles={this.state.graphVisToggles}
              onChangeFullscreenScaling={this.changedFullscreenScaling}
              onChangeVisibilityToggles={this.changedGraphVisToggles}
              onSelectTab={this.selectShareTab}
              onCopyClick={this.copy}
            />}

          <div className='buttons'>
            <button onClick={this.props.close}>
              {translate('~SHARE_DIALOG.CLOSE')}
            </button>
          </div>
          {SHOW_LONGEVITY_WARNING &&
            <div className='longevity-warning'>
              {translate('~SHARE_DIALOG.LONGEVITY_WARNING')}
            </div>}
        </div>
      </ModalDialogView>
    )
  }
}
