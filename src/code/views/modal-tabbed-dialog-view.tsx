import React from 'react'
import ModalDialogView from './modal-dialog-view'
import TabbedPanelView from './tabbed-panel-view'

interface TabInfo {
  label: string
  component: React.ReactNode
  capability?: string
  onSelected?: (capability?: string) => void
}

interface ModalTabbedDialogViewProps {
  title?: string
  tabs: TabInfo[]
  selectedTabIndex?: number
  close?: () => void
}

const ModalTabbedDialogView: React.FC<ModalTabbedDialogViewProps> = ({
  title,
  tabs,
  selectedTabIndex,
  close
}) => {
  return (
    <ModalDialogView title={title} close={close}>
      <TabbedPanelView tabs={tabs} selectedTabIndex={selectedTabIndex} />
    </ModalDialogView>
  )
}

export default ModalTabbedDialogView
