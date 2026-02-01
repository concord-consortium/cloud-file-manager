import React from 'react'
import TabbedPanel from './tabbed-panel-view'
import tr from '../utils/translate'
import ModalTabbedDialog from './modal-tabbed-dialog-view'
import LocalFileTab from './local-file-tab-list-view'
import UrlTab from './url-tab-view'
import { CloudMetadata } from '../providers/provider-interface'

interface ImportTabbedDialogProps {
  dialog: {
    callback?: (data: any) => void
  }
  close: () => void
  client: {
    alert: (message: string) => void
  }
}

const ImportTabbedDialog: React.FC<ImportTabbedDialogProps> = ({ dialog, close, client }) => {
  const importFile = (metadata: CloudMetadata, via: string) => {
    if ((metadata.provider as any) === 'localFile') {
      const reader = new FileReader()
      reader.onload = loaded => {
        const data = {
          file: {
            name: metadata.providerData?.file?.name,
            content: loaded.target?.result,
            object: metadata.providerData?.file
          },
          via
        }
        dialog.callback?.(data)
      }
      reader.readAsText(metadata.providerData?.file)
    }
  }

  const importUrl = (url: string, via: string) => {
    dialog.callback?.({ url, via })
  }

  const tabs = [
    TabbedPanel.Tab({
      label: tr("~IMPORT.LOCAL_FILE"),
      component: (
        <LocalFileTab
          client={client}
          dialog={{ callback: importFile }}
          provider={'localFile' as any} // we are faking the provider here so we can reuse the local file tab
          close={close}
        />
      )
    }),
    TabbedPanel.Tab({
      label: tr("~IMPORT.URL"),
      component: (
        <UrlTab
          client={client}
          dialog={{ callback: importUrl }}
          close={close}
        />
      )
    })
  ]

  return (
    <ModalTabbedDialog
      title={tr("~DIALOG.IMPORT_DATA")}
      close={close}
      tabs={tabs}
      selectedTabIndex={0}
    />
  )
}

export default ImportTabbedDialog
