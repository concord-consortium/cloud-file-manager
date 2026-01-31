import createReactClass from 'create-react-class'
import ReactDOMFactories from 'react-dom-factories'
import { createReactFactory } from "../create-react-factory"
import modalDialogView from './modal-dialog-view'
import tr  from '../utils/translate'

const {div, button} = ReactDOMFactories
const ModalDialog = createReactFactory(modalDialogView)

export default createReactClass({

  displayName: 'AlertDialogView',

  close() {
    this.props.close?.()
    this.props.callback?.()
  },

  render() {
    return (ModalDialog({title: this.props.title || (tr('~ALERT_DIALOG.TITLE')), close: this.close, zIndex: 500},
      (div({className: 'alert-dialog'},
        (div({className: 'alert-dialog-message', dangerouslySetInnerHTML: {__html: this.props.message}})),
        (div({className: 'buttons'},
          (button({onClick: this.close}, tr('~ALERT_DIALOG.CLOSE')))
        ))
      ))
    ))
  }
})
