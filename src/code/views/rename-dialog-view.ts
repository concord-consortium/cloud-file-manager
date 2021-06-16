// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import tr  from '../utils/translate'
import modalDialogView from './modal-dialog-view'

// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ReactDOMFactories'.
const {div, input, button} = ReactDOMFactories
// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'createReactFactory'.
const ModalDialog = createReactFactory(modalDialogView)

// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'createReactClass'.
export default createReactClass({

  displayName: 'RenameDialogView',

  getInitialState() {
    const filename = this.props.filename || ''
    return {
      filename,
      trimmedFilename: this.trim(filename)
    }
  },

  componentDidMount() {
    // @ts-expect-error ts-migrate(2686) FIXME: 'ReactDOM' refers to a UMD global, but the current... Remove this comment to see the full error message
    this.filename = ReactDOM.findDOMNode(this.filenameRef)
    return this.filename.focus()
  },

  updateFilename() {
    const filename = this.filename.value
    return this.setState({
      filename,
      trimmedFilename: this.trim(filename)
    })
  },

  trim(s: any) {
    return s.replace(/^\s+|\s+$/, '')
  },

  rename(e: any) {
    if (this.state.trimmedFilename.length > 0) {
      if (typeof this.props.callback === 'function') {
        this.props.callback(this.state.filename)
      }
      return this.props.close()
    } else {
      e.preventDefault()
      return this.filename.focus()
    }
  },

  render() {
    // @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 1.
    return ModalDialog({title: (tr('~DIALOG.RENAME')), close: this.props.close},
      (div({className: 'rename-dialog'},
        (input({ref: ((elt: any) => { return this.filenameRef = elt }), placeholder: 'Filename', value: this.state.filename, onChange: this.updateFilename})),
        (div({className: 'buttons'},
          // @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 1.
          (button({className: (this.state.trimmedFilename.length === 0 ? 'disabled' : ''), onClick: this.rename}, tr('~RENAME_DIALOG.RENAME'))),
          // @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 1.
          (button({onClick: this.props.close}, tr('~RENAME_DIALOG.CANCEL')))
        ))
      ))
    )
  }
})
