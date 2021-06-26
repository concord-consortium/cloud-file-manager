import React from 'react'

const SHOW_LONGEVITY_WARNING = false

import ModalDialogView from './modal-dialog-view'
import {ShareLoadingView} from './share-loading-view'
import { ShareDialogStatusView } from './share-dialog-status-view'
import { ShareDialogTabsView } from './share-dialog-tabs-view'
import { CloudFileManagerClient } from '../client'
import translate from '../utils/translate'

const CFM_PRODUCTION_URL = "https://cloud-file-manager.concord.org"
const CFM_PRODUCTION_AUTOLAUNCH_URL = `${CFM_PRODUCTION_URL}/autolaunch/autolaunch.html`
const CODAP_PRODUCTION_URL = "https://codap.concord.org/releases/latest/"

interface IShareDialogPropsSettings {
  serverUrl?: string;
  serverUrlLabel?: string;
}
interface IShareDialogProps {
  client: CloudFileManagerClient;
  settings?: IShareDialogPropsSettings;
  enableLaraSharing?: boolean;
  close: () => void;
}
interface IShareDialogState {
  link: string | null;
  embed: string | null;
  serverUrl: string;
  serverUrlLabel: string;
  fullscreenScaling: boolean;
  graphVisToggles: boolean;
  tabSelected: 'embed' | 'link' | 'lara';
  isLoadingShared: boolean;
}

export default class ShareDialogView extends React.Component<IShareDialogProps, IShareDialogState> {

  state: IShareDialogState

  constructor(props: IShareDialogProps) {
    super(props)

    this.state = {
      link: this.getShareLink(),
      embed: this.getEmbed(),
      serverUrl: this.props.settings.serverUrl || CODAP_PRODUCTION_URL,
      serverUrlLabel: this.props.settings.serverUrlLabel || translate("~SHARE_DIALOG.LARA_CODAP_URL"),
      fullscreenScaling: true,
      graphVisToggles: false,
      tabSelected: 'link',
      isLoadingShared: false
    }
  }

  // To support legacy shares:
  getSharedDocumentId() {
    const { client } = this.props
    return client.state?.currentContent?.get("sharedDocumentId")
  }

  // Get a documentID, or going forward, always return a URL to a document
  getShareUrl() {
    const { client } = this.props
    const shared = client.isShared()
    const sharedDocumentUrl = client.state?.currentContent?.get("sharedDocumentUrl")
    const sharedDocumentId = this.getSharedDocumentId()
    if (shared) {
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
      return `${this.props.client.getCurrentUrl()}#shared=${encodeURIComponent(shareRef)}`
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
    const graphVisToggles = this.state.graphVisToggles ? '?app=is' : ''
    // graphVisToggles is a parameter handled by CODAP, so it needs to be added to its URL.
    const server = encodeURIComponent(`${this.state.serverUrl}${graphVisToggles}`)
    // Other params are handled by document server itself:
    const fullscreenScaling = this.state.fullscreenScaling ? '&scaling' : ''

    return `${CFM_PRODUCTION_AUTOLAUNCH_URL}?documentId=${documentId}&server=${server}${fullscreenScaling}`
  }
  // TODO: Consider using queryparams to make URL construction less janky⬆

  // adapted from https://github.com/sudodoki/copy-to-clipboard/blob/master/index.js
  copy = (e: any) => {
    let mark, range, selection
    e.preventDefault()
    let copied = false
    const toCopy = (() => { switch (this.state.tabSelected) {
      case 'embed': return this.getEmbed()
      case 'link': return this.getShareLink()
      case 'lara': return this.getLara()
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
      this.props.client.alert(translate(copied ? "~SHARE_DIALOG.COPY_SUCCESS" : "~SHARE_DIALOG.COPY_ERROR"),
                              translate("~SHARE_DIALOG.COPY_TITLE"))
    }
  }

  updateShare = () => {
    return this.props.client.shareUpdate()
  }

  toggleShare = (e: React.MouseEvent) => {
    e.preventDefault()
    this.setState({
      isLoadingShared: true
    })
    return this.props.client.toggleShare(() => {
      return this.setState({
        link: this.getShareLink(),
        embed: this.getEmbed(),
        isLoadingShared: false
      })
    })
  }

  selectLinkTab = () => {
    return this.setState({tabSelected: 'link'})
  }

  selectEmbedTab = () => {
    return this.setState({tabSelected: 'embed'})
  }

  selectLaraTab = () => {
    return this.setState({tabSelected: 'lara'})
  }

  changedServerUrl = (event: React.ChangeEvent<HTMLInputElement>) => {
    return this.setState({serverUrl: event.target.value})
  }

  changedFullscreenScaling = (event: React.ChangeEvent<HTMLInputElement>) => {
    return this.setState({fullscreenScaling: event.target.checked})
  }

  changedGraphVisToggles = (event: React.ChangeEvent<HTMLInputElement>) => {
    return this.setState({graphVisToggles: event.target.checked})
  }

  render() {

    const { isLoadingShared, link } = this.state
    const sharing = link != null

    return (
      <ModalDialogView title={translate('~DIALOG.SHARED')} close={this.props.close}>
        <div className='share-dialog'>
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
              lara={{
                enableLaraSharing: this.props.enableLaraSharing,
                url: this.getLara(),
                serverUrlLabel: this.state.serverUrlLabel,
                serverUrl: this.state.serverUrl,
                fullscreenScaling: this.state.fullscreenScaling,
                visibilityToggles: this.state.graphVisToggles,
                onChangeServerUrl: this.changedServerUrl,
                onChangeFullscreenScaling: this.changedFullscreenScaling,
                onChangeVisibilityToggles: this.changedGraphVisToggles
              }}
              onSelectLinkTab={this.selectLinkTab}
              onSelectEmbedTab={this.selectEmbedTab}
              onSelectLaraTab={this.selectLaraTab}
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
