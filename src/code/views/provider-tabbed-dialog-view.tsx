import React from 'react'
import { createReactFactory, ReactFactory } from '../create-react-factory'
import tr from '../utils/translate'
import TabbedPanel from './tabbed-panel-view'
import ModalTabbedDialog from './modal-tabbed-dialog-view'
import FileDialogTab from './file-dialog-tab-view'
import SelectProviderDialogTab from './select-provider-dialog-tab-view'
import { ProviderInterface, CloudMetadata, ECapabilities } from '../providers/provider-interface'

// Create factories for the tab components
const FileDialogTabFactory = createReactFactory(FileDialogTab)
const SelectProviderDialogTabFactory = createReactFactory(SelectProviderDialogTab)

interface DialogData {
  action: string
  title: string
  data?: any
  callback?: (metadata: CloudMetadata) => void
}

interface ClientState {
  availableProviders: ProviderInterface[]
  metadata?: CloudMetadata
}

interface ProviderTabbedDialogProps {
  dialog: DialogData
  close: () => void
  client: {
    state: ClientState
    alert: (message: string, title?: string) => void
    confirm: (message: string, callback: () => void) => void
  }
}

type DialogConfig = readonly [ECapabilities | null, ReactFactory]

const ProviderTabbedDialog: React.FC<ProviderTabbedDialogProps> = ({ dialog, close, client }) => {
  const getDialogConfig = (): DialogConfig => {
    switch (dialog.action) {
      case 'openFile': return [ECapabilities.list, FileDialogTabFactory] as const
      case 'saveFile': case 'saveFileAs': return [ECapabilities.save, FileDialogTabFactory] as const
      case 'saveSecondaryFileAs': return [ECapabilities["export"], FileDialogTabFactory] as const
      case 'createCopy': return [ECapabilities.save, FileDialogTabFactory] as const
      case 'selectProvider': return [null, SelectProviderDialogTabFactory] as const
      default: return [null, FileDialogTabFactory] as const
    }
  }

  const [capability, TabComponentFactory] = getDialogConfig()

  const tabs = []
  let selectedTabIndex = 0

  for (let i = 0; i < client.state.availableProviders.length; i++) {
    const provider = client.state.availableProviders[i]
    if (!capability || provider.capabilities[capability]) {
      const filteredTabFactory = provider.filterTabComponent(capability as ECapabilities, TabComponentFactory)
      if (filteredTabFactory) {
        const component = filteredTabFactory({
          client,
          dialog,
          close,
          provider
        })
        const onSelected = (provider as any).onProviderTabSelected?.bind(provider)
        tabs.push(TabbedPanel.Tab({
          label: tr(provider.displayName ?? ''),
          component,
          capability: capability ?? undefined,
          onSelected
        }))
        if (provider.name === client.state.metadata?.provider?.name) {
          selectedTabIndex = tabs.length - 1
        }
      }
    }
  }

  return (
    <ModalTabbedDialog
      title={tr(dialog.title)}
      close={close}
      tabs={tabs}
      selectedTabIndex={selectedTabIndex}
    />
  )
}

export default ProviderTabbedDialog
