import React, { useEffect, Key } from 'react'
import { Tabs, TabList, Tab, TabPanel } from 'react-aria-components'

export interface TabInfo {
  label: string
  component: React.ReactNode
  capability?: string
  onSelected?: (capability?: string) => void
  key?: string
}

interface TabbedPanelViewProps {
  tabs: TabInfo[]
  selectedTabIndex?: number
  dialogName?: string
}

interface TabbedPanelViewComponent extends React.FC<TabbedPanelViewProps> {
  Tab: (settings?: Partial<TabInfo>) => TabInfo
}

const TabbedPanelViewBase: React.FC<TabbedPanelViewProps> = ({
  tabs,
  selectedTabIndex: initialIndex = 0,
  dialogName
}) => {
  // Call onSelected for the initial tab on mount
  useEffect(() => {
    const tab = tabs[initialIndex]
    tab?.onSelected?.(tab.capability)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const tabKeys = tabs.map((tab, index) => tab.key ?? String(index))
  const initialKey = tabKeys[initialIndex] ?? String(initialIndex)

  const handleSelectionChange = (key: Key) => {
    const index = tabKeys.indexOf(String(key))
    const tab = tabs[index]
    tab?.onSelected?.(tab.capability)
  }

  return (
    <Tabs
      className="tabbed-panel"
      defaultSelectedKey={initialKey}
      onSelectionChange={handleSelectionChange}
      orientation="vertical"
    >
      <TabList
        className="workspace-tabs"
        data-testid={dialogName ? `cfm-dialog-${dialogName}-tabs` : undefined}
      >
        {tabs.map((tab, index) => (
          (() => {
            const tabKey = tab.key ?? String(index)
            const tabTestId = dialogName && tab.key
              ? `cfm-dialog-${dialogName}-tab-${tabKey}`
              : undefined
            return (
          <Tab
            key={index}
            id={tabKey}
            data-testid={tabTestId}
            className={({ isSelected }) => `workspace-tab ${isSelected ? 'tab-selected' : ''}`}
          >
            {tab.label}
          </Tab>
            )
          })()
        ))}
      </TabList>
      {tabs.map((tab, index) => {
        const tabKey = tab.key ?? String(index)
        const contentTestId = dialogName && tab.key
          ? `cfm-dialog-${dialogName}-tab-${tabKey}-content`
          : undefined
        return (
          <TabPanel
            key={index}
            id={tabKey}
            className="workspace-tab-component"
            data-testid={contentTestId}
            shouldForceMount
          >
            {tab.component}
          </TabPanel>
        )
      })}
    </Tabs>
  )
}

// Static helper to create tab objects
const TabbedPanelView = Object.assign(TabbedPanelViewBase, {
  Tab: (settings: Partial<TabInfo> = {}): TabInfo => ({
    label: settings.label || '',
    component: settings.component,
    capability: settings.capability,
    onSelected: settings.onSelected,
    key: settings.key
  })
}) as TabbedPanelViewComponent

export default TabbedPanelView
