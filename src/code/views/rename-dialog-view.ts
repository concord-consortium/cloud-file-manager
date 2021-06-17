// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import tr  from '../utils/translate'
import modalDialogView from './modal-dialog-view'

const {div, input, button} = ReactDOMFactories
const ModalDialog = createReactFactory(modalDialogView)

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
    return ModalDialog({title: (tr('~DIALOG.RENAME')), close: this.props.close},
      (div({className: 'rename-dialog'},
        (input({ref: ((elt: any) => { return this.filenameRef = elt }), placeholder: 'Filename', value: this.state.filename, onChange: this.updateFilename})),
        (div({className: 'buttons'},
          (button({className: (this.state.trimmedFilename.length === 0 ? 'disabled' : ''), onClick: this.rename}, tr('~RENAME_DIALOG.RENAME'))),
          (button({onClick: this.props.close}, tr('~RENAME_DIALOG.CANCEL')))
        ))
      ))
    )
  }
})
