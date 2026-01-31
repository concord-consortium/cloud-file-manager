// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import createReactClass from 'create-react-class'
import { saveAs } from 'file-saver'
import ReactDOMFactories from 'react-dom-factories'
const {div, input, button, a} = ReactDOMFactories
import { CloudMetadata } from '../providers/provider-interface'
import { cloudContentFactory } from '../providers/provider-interface'
import { isIOSSafari, handleIOSDownload } from '../utils/ios-file-saver'
import tr from '../utils/translate'

export default createReactClass({

  displayName: 'LocalFileSaveTab',

  getInitialState() {
    // If the dialog has the content to save, which occurs when saving secondary content
    // like CSV files, then use that instead of the document content and make sure that
    // it doesn't get modified by (for instance) trying to remove sharing metadata. To
    // do so, we specify that we want to include the share info, which tells the client
    // to leave the content alone.

    const { client, dialog: { data } } = this.props
    const { appOptions } = client
    const { metadata } = client.state

    const hasPropsContent = data?.content != null
    const extension = hasPropsContent && data.extension ? data.extension : (appOptions?.extension ?? 'json')
    const mimeType = hasPropsContent && data.mimeType ? data.mimeType : (appOptions?.localFileMimeType ?? appOptions?.mimeType ?? 'text/plain')
    const filename = metadata?.name ?? (tr("~MENUBAR.UNTITLED_DOCUMENT"))

    return {
      filename,
      supportsDownloadAttribute: document.createElement('a').download !== undefined,
      downloadFilename: this.getDownloadFilename(hasPropsContent, filename, extension),
      extension,
      mimeType,
      shared: client.isShared(),
      hasPropsContent,
      includeShareInfo: hasPropsContent,
      gotContent: hasPropsContent,
      content: (hasPropsContent ? data.content : undefined)
    }
  },

  componentDidMount() {
    if (!this.state.hasPropsContent) {
      this.props.client._event('getContent', { shared: this.props.client._sharedMetadata() }, (content: any) => {
        const envelopedContent = cloudContentFactory.createEnvelopedCloudContent(content)
        __guard__(this.props.client.state != null ? this.props.client.state.currentContent : undefined, (x: any) => x.copyMetadataTo(envelopedContent))
        return this.setState({
          gotContent: true,
          content: envelopedContent
        })
      })
    }

    // Using the React onClick handler for the download button yielded odd behaviors
    // in which the onClick handler got triggered multiple times and the default
    // handler could not be prevented, presumably due to React's SyntheticEvent system.
    // The solution here is to use standard browser event handlers.
    return this.downloadRef.addEventListener('click', this.confirm)
  },

  componentWillUnmount() {
    return this.downloadRef.removeEventListener('click', this.confirm)
  },

  filenameChanged() {
    const filename = this.filenameRef.value
    return this.setState({
      filename,
      downloadFilename: this.getDownloadFilename(this.state.hasPropsContent, filename, this.state.extension)
    })
  },

  includeShareInfoChanged() {
    return this.setState({includeShareInfo: this.includeShareInfoRef.checked})
  },

  getDownloadFilename(hasPropsContent: boolean, filename: string, extension: string) {
    const newName = filename.replace(/^\s+|\s+$/, '')
    if (hasPropsContent) {
      return CloudMetadata.newExtension(newName, extension)
    }
    else {
      return CloudMetadata.withExtension(newName, extension)
    }
  },

  confirm(e: any, simulateClick: boolean) {
    if (this.confirmDisabled()) {
      if (e != null) {
        e.preventDefault()
      }
      return
    }

    // Lazily create blob only when needed (not needed for browsers with download attribute support)
    const getBlob = () => this.props.client.getDownloadBlob(this.state.content, this.state.includeShareInfo, this.state.mimeType)

    // Handle iOS Safari specially due to blob URL bugs in iOS 18.2+
    if (isIOSSafari()) {
      if (e != null) {
        e.preventDefault()
      }
      this.handleIOSSave(getBlob())
      return false
    }

    // Standard download handling for other browsers
    if (this.state.supportsDownloadAttribute) {
      this.downloadRef.href = this.props.client.getDownloadUrl(this.state.content, this.state.includeShareInfo, this.state.mimeType)
      if (simulateClick) { this.downloadRef.click() }
    } else {
      saveAs(getBlob(), this.state.downloadFilename, { autoBom: true })
      if (e != null) {
        e.preventDefault()
      }
    }

    this.completeDownload()

    // return value indicates whether to trigger href
    return this.state.supportsDownloadAttribute
  },

  async handleIOSSave(blob: Blob) {
    const handled = await handleIOSDownload(blob, this.state.downloadFilename)
    if (!handled) {
      // Fall back to standard saveAs if iOS handling failed
      saveAs(blob, this.state.downloadFilename, { autoBom: true })
    }
    this.completeDownload()
  },

  completeDownload() {
    const metadata = new CloudMetadata({
      name: this.state.downloadFilename.split('.')[0],
      type: CloudMetadata.File,
      provider: this.props.provider
    })
    this.props.dialog.callback(metadata)
    this.props.close()
  },

  contextMenu(e: any) {
    this.downloadRef.href = this.props.client.getDownloadUrl(this.state.content, this.state.includeShareInfo, this.state.mimeType)
  },

  cancel() {
    this.props.close()
  },

  watchForEnter(e: any) {
    if ((e.keyCode === 13) && !this.confirmDisabled()) {
      e.preventDefault()
      e.stopPropagation()
      this.confirm(null, true)
    }
  },

  confirmDisabled() {
    return (this.state.downloadFilename.length === 0) || !this.state.gotContent
  },

  render() {
    const confirmDisabled = this.confirmDisabled()

    // for modern browsers
    const downloadAnchor = (a({
      href: '#',
      ref: (elt: any) => { return this.downloadRef = elt },
      className: (confirmDisabled ? 'disabled' : ''),
      download: this.state.downloadFilename,
      onContextMenu: this.contextMenu
    }, tr('~FILE_DIALOG.DOWNLOAD')))

    // for Safari (or other non-modern browsers)
    const downloadButton = (button({
      ref: (elt: any) => { return this.downloadRef = elt },
      className: (confirmDisabled ? 'disabled' : '')
    }, tr('~FILE_DIALOG.DOWNLOAD')))

    return (div({className: 'dialogTab localFileSave'},
      (input({type: 'text', ref: ((elt: any) => { return this.filenameRef = elt }), value: this.state.filename, placeholder: (tr("~FILE_DIALOG.FILENAME")), onChange: this.filenameChanged, onKeyDown: this.watchForEnter})),
      (div({className: 'saveArea'},
        this.state.shared && !this.state.hasPropsContent ?
          (div({className: 'shareCheckbox'},
            (input({type: 'checkbox', ref: ((elt: any) => { return this.includeShareInfoRef = elt }), value: this.state.includeShareInfo, onChange: this.includeShareInfoChanged})),
            (tr('~DOWNLOAD_DIALOG.INCLUDE_SHARE_INFO'))
          )) : undefined
      )),
      (div({className: 'buttons'},
        this.state.supportsDownloadAttribute ? downloadAnchor : downloadButton,
        (button({onClick: this.cancel}, (tr("~FILE_DIALOG.CANCEL"))))
      ))
    ))
  }
})
function __guard__(value: any, transform: any) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined
}
