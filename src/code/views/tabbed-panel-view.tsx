import React, { useState, useEffect } from 'react'

interface TabInfo {
  label: string
  component: React.ReactNode
  capability?: string
  onSelected?: (capability?: string) => void
}

interface TabProps {
  label: string
  index: number
  selected: boolean
  onSelected: (index: number) => void
}

const Tab: React.FC<TabProps> = ({ label, index, selected, onSelected }) => {
  const handleClick = (e: React.MouseEvent<HTMLLIElement>) => {
    e.preventDefault()
    onSelected(index)
  }

  const className = selected ? 'tab-selected' : ''
  return <li className={className} onClick={handleClick}>{label}</li>
}

interface TabbedPanelViewProps {
  tabs: TabInfo[]
  selectedTabIndex?: number
}

interface TabbedPanelViewComponent extends React.FC<TabbedPanelViewProps> {
  Tab: (settings?: Partial<TabInfo>) => TabInfo
}

const TabbedPanelViewBase: React.FC<TabbedPanelViewProps> = ({ tabs, selectedTabIndex: initialIndex = 0 }) => {
  const [selectedTabIndex, setSelectedTabIndex] = useState(initialIndex)

  useEffect(() => {
    const tab = tabs[selectedTabIndex]
    tab?.onSelected?.(tab.capability)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleTabSelected = (index: number) => {
    const tab = tabs[index]
    tab?.onSelected?.(tab.capability)
    setSelectedTabIndex(index)
  }

  const renderTab = (tab: TabInfo, index: number) => (
    <Tab
      key={index}
      label={tab.label}
      index={index}
      selected={index === selectedTabIndex}
      onSelected={handleTabSelected}
    />
  )

  const renderTabs = () => (
    <div className="workspace-tabs">
      {tabs.map((tab, index) => (
        <ul key={index}>{renderTab(tab, index)}</ul>
      ))}
    </div>
  )

  const renderSelectedPanel = () => (
    <div className="workspace-tab-component">
      {tabs.map((tab, index) => (
        <div
          key={index}
          style={{ display: index === selectedTabIndex ? 'block' : 'none' }}
        >
          {tab.component}
        </div>
      ))}
    </div>
  )

  return (
    <div className="tabbed-panel">
      {renderTabs()}
      {renderSelectedPanel()}
    </div>
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
