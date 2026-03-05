import createReactClass from 'create-react-class'
import { createReactFactory } from '../create-react-factory'
import modalDialogView from './modal-dialog-view'
import tabbedPanelView from './tabbed-panel-view'

const ModalDialog = createReactFactory(modalDialogView)
const TabbedPanel = createReactFactory(tabbedPanelView)

export default createReactClass({

  displayName: 'ModalTabbedDialogView',

  render() {
    return (ModalDialog({title: this.props.title, close: this.props.close},
      (TabbedPanel({tabs: this.props.tabs, selectedTabIndex: this.props.selectedTabIndex}))
    ))
  }
})
