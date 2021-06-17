// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import tr  from '../utils/translate'
import { CloudMetadata }  from '../providers/provider-interface'
import modalDialogView from './modal-dialog-view'

const {div, input, a, button} = ReactDOMFactories
const ModalDialog = createReactFactory(modalDialogView)

export default createReactClass({

  displayName: 'DownloadDialogView',

  getInitialState() {
    // @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 2.
    const filename = CloudMetadata.withExtension(this.props.filename || (tr("~MENUBAR.UNTITLED_DOCUMENT")), 'json')
    return {
      filename,
      trimmedFilename: this.trim(filename),
      includeShareInfo: false,
      shared: this.props.client.isShared()
    }
  },

  componentDidMount() {
    return this.filenameRef.focus()
  },

  updateFilename() {
    const filename = this.filenameRef.value
    return this.setState({
      filename,
      trimmedFilename: this.trim(filename)
    })
  },

  updateIncludeShareInfo() {
    return this.setState({includeShareInfo: this.includeShareInfoRef.checked})
  },

  trim(s: any) {
    return s.replace(/^\s+|\s+$/, '')
  },

  download(e: any, simulateClick: any) {
    if (!this.downloadDisabled()) {
      this.downloadRef.setAttribute('href', this.props.client.getDownloadUrl(this.props.content, this.state.includeShareInfo))
      if (simulateClick) { this.downloadRef.click() }
      return this.props.close()
    } else {
      if (e != null) {
        e.preventDefault()
      }
      return this.filenameRef.focus()
    }
  },

  downloadDisabled() {
    return this.state.trimmedFilename.length === 0
  },

  watchForEnter(e: any) {
    if ((e.keyCode === 13) && !this.downloadDisabled()) {
      e.preventDefault()
      e.stopPropagation()
      return this.download(null, true)
    }
  },

  render() {
    // @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 1.
    return ModalDialog({title: (tr('~DIALOG.DOWNLOAD')), close: this.props.close},
      (div({className: 'download-dialog'},
        (input({type: 'text', ref: ((elt: any) => { return this.filenameRef = elt }), placeholder: 'Filename', value: this.state.filename, onChange: this.updateFilename, onKeyDown: this.watchForEnter})),
        this.state.shared ?
          (div({className: 'download-share'},
            (input({type: 'checkbox', ref: ((elt: any) => { return this.includeShareInfoRef = elt }), value: this.state.includeShareInfo, onChange: this.updateIncludeShareInfo})),
            // @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 1.
            (tr('~DOWNLOAD_DIALOG.INCLUDE_SHARE_INFO'))
          )) : undefined,
        (div({className: 'buttons'},
          // @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 1.
          (a({href: '#', ref: ((elt: any) => { return this.downloadRef = elt }), className: (this.downloadDisabled() ? 'disabled' : ''), download: this.state.trimmedFilename, onClick: this.download}, tr('~DOWNLOAD_DIALOG.DOWNLOAD'))),
          // @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 1.
          (button({onClick: this.props.close}, tr('~DOWNLOAD_DIALOG.CANCEL')))
        ))
      ))
    )
  }
})
