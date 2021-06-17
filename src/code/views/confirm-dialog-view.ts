// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {div, button} = ReactDOMFactories

import modalDialogView from './modal-dialog-view'
const ModalDialog = createReactFactory(modalDialogView)

import tr  from '../utils/translate'

export default createReactClass({

  displayName: 'ConfirmDialogView',

  confirm() {
    if (typeof this.props.callback === 'function') {
      this.props.callback()
    }
    return (typeof this.props.close === 'function' ? this.props.close() : undefined)
  },

  reject() {
    if (typeof this.props.rejectCallback === 'function') {
      this.props.rejectCallback()
    }
    return (typeof this.props.close === 'function' ? this.props.close() : undefined)
  },

  render() {
    // @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 1.
    return (ModalDialog({title: (this.props.title || tr('~CONFIRM_DIALOG.TITLE')), close: this.reject, zIndex: 500},
      (div({className: 'confirm-dialog'},
        (div({className: 'confirm-dialog-message', dangerouslySetInnerHTML: {__html: this.props.message}})),
        (div({className: 'buttons'},
          // @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 1.
          (button({onClick: this.confirm}, this.props.yesTitle || tr('~CONFIRM_DIALOG.YES'))),
          // @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 1.
          (!this.props.hideNoButton ? (button({onClick: this.reject}, this.props.noTitle || tr('~CONFIRM_DIALOG.NO'))) : undefined)
        ))
      ))
    ))
  }
})
