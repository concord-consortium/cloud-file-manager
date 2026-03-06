import React, { useEffect, Key } from 'react'
import { Tabs, TabList, Tab, TabPanel } from 'react-aria-components'

interface TabInfo {
  label: string
  component: React.ReactNode
  capability?: string
  onSelected?: (capability?: string) => void
}

interface TabbedPanelViewProps {
  tabs: TabInfo[]
  selectedTabIndex?: number
}

interface TabbedPanelViewComponent extends React.FC<TabbedPanelViewProps> {
  Tab: (settings?: Partial<TabInfo>) => TabInfo
}

const TabbedPanelViewBase: React.FC<TabbedPanelViewProps> = ({ tabs, selectedTabIndex: initialIndex = 0 }) => {
  // Call onSelected for the initial tab on mount
  useEffect(() => {
    const tab = tabs[initialIndex]
    tab?.onSelected?.(tab.capability)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectionChange = (key: Key) => {
    const index = Number(key)
    const tab = tabs[index]
    tab?.onSelected?.(tab.capability)
  }

  return (
    <Tabs
      className="tabbed-panel"
      defaultSelectedKey={String(initialIndex)}
      onSelectionChange={handleSelectionChange}
      orientation="vertical"
    >
      <TabList className="workspace-tabs">
        {tabs.map((tab, index) => (
          <Tab
            key={index}
            id={String(index)}
            className={({ isSelected }) => `workspace-tab ${isSelected ? 'tab-selected' : ''}`}
          >
            {tab.label}
          </Tab>
        ))}
      </TabList>
      {tabs.map((tab, index) => (
        <TabPanel
          key={index}
          id={String(index)}
          className="workspace-tab-component"
          shouldForceMount
        >
          {tab.component}
        </TabPanel>
      ))}
    </Tabs>
  )
}

// Static helper to create tab objects
const TabbedPanelView = Object.assign(TabbedPanelViewBase, {
  Tab: (settings: Partial<TabInfo> = {}): TabInfo => ({
    label: settings.label || '',
    component: settings.component,
    capability: settings.capability,
    onSelected: settings.onSelected
  })
}) as TabbedPanelViewComponent

export default TabbedPanelView
