import createReactClass from 'create-react-class'
import ReactDOMFactories from 'react-dom-factories'
import classNames from 'classnames'

import { createReactFactory } from '../create-react-factory'
const {div, button} = ReactDOMFactories

import modalDialogView from './modal-dialog-view'
const ModalDialog = createReactFactory(modalDialogView)

import tr  from '../utils/translate'

export default createReactClass({

  displayName: 'ConfirmDialogView',

  confirm() {
    this.props.callback?.()
    this.props.close?.()
  },

  reject() {
    this.props.rejectCallback?.()
    this.props.close?.()
  },

  render() {
    const className = classNames('confirm-dialog', this.props.className)
    return (ModalDialog({title: (this.props.title || tr('~CONFIRM_DIALOG.TITLE')), close: this.reject, zIndex: 500},
      (div({className},
        (div({className: 'confirm-dialog-message', dangerouslySetInnerHTML: {__html: this.props.message}})),
        (div({className: 'buttons'},
          (button({onClick: this.confirm}, this.props.yesTitle || tr('~CONFIRM_DIALOG.YES'))),
          (!this.props.hideNoButton ? (button({onClick: this.reject}, this.props.noTitle || tr('~CONFIRM_DIALOG.NO'))) : undefined)
        ))
      ))
    ))
  }
})
