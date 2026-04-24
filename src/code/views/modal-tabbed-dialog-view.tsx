import React from 'react'
import ModalDialogView from './modal-dialog-view'
import TabbedPanelView, { TabInfo } from './tabbed-panel-view'

interface ModalTabbedDialogViewProps {
  title?: string
  titleClassName?: string
  tabs: TabInfo[]
  selectedTabIndex?: number
  close?: () => void
  dialogTestId?: string
  dialogName?: string
}

const ModalTabbedDialogView: React.FC<ModalTabbedDialogViewProps> = ({
  title,
  titleClassName,
  tabs,
  selectedTabIndex,
  close,
  dialogTestId,
  dialogName
}) => {
  return (
    <ModalDialogView title={title} titleClassName={titleClassName} close={close}>
      <div data-testid={dialogTestId}>
        <TabbedPanelView tabs={tabs} selectedTabIndex={selectedTabIndex} dialogName={dialogName} />
      </div>
    </ModalDialogView>
  )
}

export default ModalTabbedDialogView
