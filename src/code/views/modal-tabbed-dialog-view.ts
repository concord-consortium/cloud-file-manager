// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import modalDialogView from './modal-dialog-view'
import tabbedPanelView from './tabbed-panel-view'

// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'createReactFactory'.
const ModalDialog = createReactFactory(modalDialogView)
// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'createReactFactory'.
const TabbedPanel = createReactFactory(tabbedPanelView)

// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'createReactClass'.
export default createReactClass({

  displayName: 'ModalTabbedDialogView',

  render() {
    return (ModalDialog({title: this.props.title, close: this.props.close},
      (TabbedPanel({tabs: this.props.tabs, selectedTabIndex: this.props.selectedTabIndex}))
    ))
  }
})
