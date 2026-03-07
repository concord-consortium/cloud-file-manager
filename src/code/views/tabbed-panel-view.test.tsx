import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import TabbedPanelView from './tabbed-panel-view'

describe('TabbedPanelView', () => {
  const createTabs = (onSelected?: jest.Mock) => [
    { label: 'Tab 1', component: <div>Content 1</div>, capability: 'cap1', onSelected },
    { label: 'Tab 2', component: <div>Content 2</div>, capability: 'cap2', onSelected },
    { label: 'Tab 3', component: <div>Content 3</div>, capability: 'cap3', onSelected }
  ]

  it('should render all tab labels', () => {
    render(
      <TabbedPanelView tabs={createTabs()} />
    )
    expect(screen.getByText('Tab 1')).toBeInTheDocument()
    expect(screen.getByText('Tab 2')).toBeInTheDocument()
    expect(screen.getByText('Tab 3')).toBeInTheDocument()
  })

  it('should render all tab content (with display styling)', () => {
    render(
      <TabbedPanelView tabs={createTabs()} />
    )
    expect(screen.getByText('Content 1')).toBeInTheDocument()
    expect(screen.getByText('Content 2')).toBeInTheDocument()
    expect(screen.getByText('Content 3')).toBeInTheDocument()
  })

  it('should select first tab by default', () => {
    render(
      <TabbedPanelView tabs={createTabs()} />
    )
    const tab1 = screen.getByText('Tab 1')
    expect(tab1).toHaveClass('tab-selected')
  })

  it('should select specified tab when selectedTabIndex provided', () => {
    render(
      <TabbedPanelView tabs={createTabs()} selectedTabIndex={1} />
    )
    const tab2 = screen.getByText('Tab 2')
    expect(tab2).toHaveClass('tab-selected')
  })

  it('should switch tabs when tab clicked', async () => {
    render(
      <TabbedPanelView tabs={createTabs()} />
    )

    const tab1 = screen.getByText('Tab 1')
    const tab2 = screen.getByText('Tab 2')

    expect(tab1).toHaveClass('tab-selected')
    expect(tab2).not.toHaveClass('tab-selected')

    await userEvent.click(tab2)

    expect(tab1).not.toHaveClass('tab-selected')
    expect(tab2).toHaveClass('tab-selected')
  })

  it('should call onSelected callback when tab selected', async () => {
    const mockOnSelected = jest.fn()
    render(
      <TabbedPanelView tabs={createTabs(mockOnSelected)} />
    )

    // First tab is selected on mount
    expect(mockOnSelected).toHaveBeenCalledWith('cap1')

    // Click second tab
    await userEvent.click(screen.getByText('Tab 2'))
    expect(mockOnSelected).toHaveBeenCalledWith('cap2')
  })

  it('should display selected tab content visibly', () => {
    render(
      <TabbedPanelView tabs={createTabs()} selectedTabIndex={0} />
    )

    const content1Container = screen.getByText('Content 1').parentElement
    const content2Container = screen.getByText('Content 2').parentElement

    expect(content1Container).toHaveStyle({ display: 'block' })
    expect(content2Container).toHaveStyle({ display: 'none' })
  })

  it('should have correct structure', () => {
    render(
      <TabbedPanelView tabs={createTabs()} />
    )

    expect(document.querySelector('.tabbed-panel')).toBeInTheDocument()
    expect(document.querySelector('.workspace-tabs')).toBeInTheDocument()
    expect(document.querySelector('.workspace-tab-component')).toBeInTheDocument()
  })

  it('should work with tabs that have no onSelected callback', async () => {
    const tabs = [
      { label: 'Tab A', component: <div>A</div> },
      { label: 'Tab B', component: <div>B</div> }
    ]
    render(
      <TabbedPanelView tabs={tabs} />
    )

    // Should not throw when clicking tabs without onSelected
    await userEvent.click(screen.getByText('Tab B'))
    expect(screen.getByText('Tab B')).toHaveClass('tab-selected')
  })
})
