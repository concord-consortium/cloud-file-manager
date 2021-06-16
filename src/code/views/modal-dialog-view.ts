// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import modalView from './modal-view'
// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ReactDOMFactories'.
const {div, i} = ReactDOMFactories
// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'createReactFactory'.
const Modal = createReactFactory(modalView)

// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'createReactClass'.
export default createReactClass({

  displayName: 'ModalDialog',

  close() {
    return (typeof this.props.close === 'function' ? this.props.close() : undefined)
  },

  render() {
    return (Modal({close: this.close, zIndex: this.props.zIndex},
      (div({className: 'modal-dialog'},
        (div({className: 'modal-dialog-wrapper'},
          (div({className: 'modal-dialog-title'},
            (i({className: "modal-dialog-title-close icon-ex", onClick: this.close})),
            this.props.title || 'Untitled Dialog'
          )),
          (div({className: 'modal-dialog-workspace'}, this.props.children))
        ))
      ))
    ))
  }
})
