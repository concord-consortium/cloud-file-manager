import createReactClass from 'create-react-class'
import { createReactFactory } from '../create-react-factory'
import tr  from '../utils/translate'
import TabbedPanel  from './tabbed-panel-view'
import modalTabbedDialogView from './modal-tabbed-dialog-view'
import fileDialogTabView from './file-dialog-tab-view'
import selectProviderDialogTabView from './select-provider-dialog-tab-view'

const ModalTabbedDialog = createReactFactory(modalTabbedDialogView)
const FileDialogTab = createReactFactory(fileDialogTabView)
const SelectProviderDialogTab = createReactFactory(selectProviderDialogTabView)

export default createReactClass({
  displayName: 'ProviderTabbedDialog',

  getDialogConfig() {
    switch (this.props.dialog.action) {
      case 'openFile': return ['list', FileDialogTab] as const
      case 'saveFile': case 'saveFileAs': return ['save', FileDialogTab] as const
      case 'saveSecondaryFileAs': return ['export', FileDialogTab] as const
      case 'createCopy': return ['save', FileDialogTab] as const
      case 'selectProvider': return [null, SelectProviderDialogTab] as const
      default: return [null, FileDialogTab] as const
    }
  },

  render() {
    const [capability, TabComponent] = this.getDialogConfig()

    const tabs = []
    let selectedTabIndex = 0
    for (let i = 0; i < this.props.client.state.availableProviders.length; i++) {
      const provider = this.props.client.state.availableProviders[i]
      if (!capability || provider.capabilities[capability]) {
        const filteredTabComponent = provider.filterTabComponent(capability as any, TabComponent)
        if (filteredTabComponent) {
          const component = filteredTabComponent({
            client: this.props.client,
            dialog: this.props.dialog,
            close: this.props.close,
            provider
          })
          const onSelected = provider.onProviderTabSelected ? provider.onProviderTabSelected.bind(provider) : null
          tabs.push((TabbedPanel as any).Tab({key: i, label: (tr(provider.displayName)), component, capability, onSelected}))
          if (provider.name === this.props.client.state.metadata?.provider?.name) {
            selectedTabIndex = tabs.length - 1
          }
        }
      }
    }

    return (ModalTabbedDialog({title: (tr(this.props.dialog.title)), close: this.props.close, tabs, selectedTabIndex}))
  }
})