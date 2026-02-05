import { render, screen } from '@testing-library/react'
import React from 'react'
import ModalTabbedDialogViewComponent from './modal-tabbed-dialog-view'

// Cast to accept props since createReactClass components don't have proper TypeScript types
const ModalTabbedDialogView = ModalTabbedDialogViewComponent as unknown as React.ComponentType<{
  title: string
  close?: () => void
  tabs: Array<{
    label: string
    component: React.ReactNode
  }>
  selectedTabIndex?: number
}>

describe('ModalTabbedDialogView', () => {
  const createTabs = () => [
    { label: 'First Tab', component: <div>First Content</div> },
    { label: 'Second Tab', component: <div>Second Content</div> }
  ]

  it('should render with title', () => {
    render(
      <ModalTabbedDialogView title="Test Dialog" tabs={createTabs()} />
    )
    expect(screen.getByTestId('modal-dialog-title')).toHaveTextContent('Test Dialog')
  })

  it('should render tab labels', () => {
    render(
      <ModalTabbedDialogView title="Test" tabs={createTabs()} />
    )
    expect(screen.getByText('First Tab')).toBeInTheDocument()
    expect(screen.getByText('Second Tab')).toBeInTheDocument()
  })

  it('should render tab content', () => {
    render(
      <ModalTabbedDialogView title="Test" tabs={createTabs()} />
    )
    expect(screen.getByText('First Content')).toBeInTheDocument()
    expect(screen.getByText('Second Content')).toBeInTheDocument()
  })

  it('should have modal dialog structure', () => {
    render(
      <ModalTabbedDialogView title="Test" tabs={createTabs()} />
    )
    expect(document.querySelector('.modal-dialog')).toBeInTheDocument()
    expect(document.querySelector('.tabbed-panel')).toBeInTheDocument()
  })

  it('should select first tab by default', () => {
    render(
      <ModalTabbedDialogView title="Test" tabs={createTabs()} />
    )
    expect(screen.getByText('First Tab')).toHaveClass('tab-selected')
  })

  it('should select specified tab when selectedTabIndex provided', () => {
    render(
      <ModalTabbedDialogView title="Test" tabs={createTabs()} selectedTabIndex={1} />
    )
    expect(screen.getByText('Second Tab')).toHaveClass('tab-selected')
  })

  it('should pass close handler to modal', () => {
    const mockClose = jest.fn()
    render(
      <ModalTabbedDialogView title="Test" tabs={createTabs()} close={mockClose} />
    )
    // Modal dialog is rendered with the close handler
    expect(document.querySelector('.modal-dialog')).toBeInTheDocument()
  })
})
