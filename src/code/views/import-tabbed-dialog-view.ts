import createReactClass from 'create-react-class'
import { createReactFactory } from '../create-react-factory'
import TabbedPanel  from './tabbed-panel-view'
import tr  from '../utils/translate'

import modalTabbedDialogView from './modal-tabbed-dialog-view'
import localfileTabListView from './local-file-tab-list-view'
import urlTabView from './url-tab-view'

const ModalTabbedDialog = createReactFactory(modalTabbedDialogView)
const LocalFileTab = createReactFactory(localfileTabListView)
const UrlTab = createReactFactory(urlTabView)

export default createReactClass({
  displayName: 'ImportTabbedDialog',

  importFile(metadata: any, via: any) {
    if (metadata.provider === 'localFile') {
      const reader = new FileReader()
      reader.onload = loaded => {
        const data = {
          file: {
            name: metadata.providerData.file.name,
            content: loaded.target?.result,
            object: metadata.providerData.file
          },
          via
        }
        this.props.dialog.callback?.(data)
      }
      reader.readAsText(metadata.providerData.file)
    }
  },

  importUrl(url: string, via: string) {
    this.props.dialog.callback?.({url, via})
  },

  render() {
    const tabs = [
      // "static" functions defined in the "statics" property don't get typed appropriately
      (TabbedPanel as any).Tab({
        key: 0,
        label: (tr("~IMPORT.LOCAL_FILE")),
        component: LocalFileTab({
          client: this.props.client,
          dialog: {
            callback: this.importFile
          },
          provider: 'localFile', // we are faking the provider here so we can reuse the local file tab
          close: this.props.close
        })
      }),
      // "static" functions defined in the "statics" property don't get typed appropriately
      (TabbedPanel as any).Tab({
        key: 1,
        label: (tr("~IMPORT.URL")),
        component: UrlTab({
          client: this.props.client,
          dialog: {
            callback: this.importUrl
          },
          close: this.props.close
        })
      })
    ]
    return (ModalTabbedDialog({title: (tr("~DIALOG.IMPORT_DATA")), close: this.props.close, tabs, selectedTabIndex: 0}))
  }
})
