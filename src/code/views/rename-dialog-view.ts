import createReactClass from 'create-react-class'
import ReactDOM from 'react-dom'
import ReactDOMFactories from 'react-dom-factories'
import { createReactFactory } from '../create-react-factory'
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
    this.filename.focus()
  },

  updateFilename() {
    const filename = this.filename.value
    this.setState({
      filename,
      trimmedFilename: this.trim(filename)
    })
  },

  trim(s: string) {
    return s.replace(/^\s+|\s+$/, '')
  },

  rename(e: React.MouseEvent<HTMLButtonElement>) {
    if (this.state.trimmedFilename.length > 0) {
      this.props.callback?.(this.state.filename)
      this.props.close?.()
    } else {
      e.preventDefault()
      this.filename.focus()
    }
  },

  render() {
    return ModalDialog({title: (tr('~DIALOG.RENAME')), close: this.props.close},
      (div({className: 'rename-dialog'},
        (input({ref: ((elt: any) => { this.filenameRef = elt }), placeholder: 'Filename', value: this.state.filename, onChange: this.updateFilename})),
        (div({className: 'buttons'},
          (button({className: (this.state.trimmedFilename.length === 0 ? 'disabled' : ''), onClick: this.rename}, tr('~RENAME_DIALOG.RENAME'))),
          (button({onClick: this.props.close}, tr('~RENAME_DIALOG.CANCEL')))
        ))
      ))
    )
  }
})
