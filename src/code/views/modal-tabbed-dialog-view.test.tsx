import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import ModalTabbedDialogView from './modal-tabbed-dialog-view'

describe('ModalTabbedDialogView', () => {
  const createTabs = () => [
    { label: 'First Tab', component: <div>First Content</div> },
    { label: 'Second Tab', component: <div>Second Content</div> }
  ]

  it('should render with title', () => {
    render(
      <ModalTabbedDialogView title="Test Dialog" tabs={createTabs()} />
    )
    expect(screen.getByTestId('cfm-dialog-title')).toHaveTextContent('Test Dialog')
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

  it('should call close handler when close button is clicked', async () => {
    const user = userEvent.setup()
    const mockClose = jest.fn()
    render(
      <ModalTabbedDialogView title="Test" tabs={createTabs()} close={mockClose} />
    )
    await act(async () => {
      await user.click(screen.getByTestId('cfm-dialog-close-button'))
    })
    expect(mockClose).toHaveBeenCalledTimes(1)
  })
})
