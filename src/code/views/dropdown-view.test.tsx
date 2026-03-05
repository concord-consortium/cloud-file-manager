import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import DropdownView from './dropdown-view'

describe('DropdownView', () => {
  const createItems = (action?: jest.Mock) => [
    { name: 'Item 1', action },
    { name: 'Item 2', action },
    { name: 'Item 3', action }
  ]

  it('should render nothing when items array is empty', () => {
    render(
      <DropdownView items={[]} />
    )
    expect(document.querySelector('.menu-list-container')).not.toBeInTheDocument()
  })

  it('should render menu items', () => {
    render(
      <DropdownView items={createItems()} />
    )
    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 2')).toBeInTheDocument()
    expect(screen.getByText('Item 3')).toBeInTheDocument()
  })

  it('should start with menu hidden', () => {
    render(
      <DropdownView items={createItems()} />
    )
    expect(document.querySelector('.menu-hidden')).toBeInTheDocument()
    expect(document.querySelector('.menu-showing')).not.toBeInTheDocument()
  })

  it('should show menu when anchor clicked', async () => {
    render(
      <DropdownView items={createItems()} />
    )

    const anchor = document.querySelector('.menu-anchor')
    await userEvent.click(anchor!)

    expect(document.querySelector('.menu-showing')).toBeInTheDocument()
    expect(document.querySelector('.menu-open')).toBeInTheDocument()
  })

  it('should close menu when clicking outside', async () => {
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <DropdownView items={createItems()} />
      </div>
    )

    const anchor = document.querySelector('.menu-anchor')
    await userEvent.click(anchor!)
    expect(document.querySelector('.menu-showing')).toBeInTheDocument()

    // Click outside the menu
    fireEvent.mouseDown(screen.getByTestId('outside'))
    expect(document.querySelector('.menu-hidden')).toBeInTheDocument()
  })

  it('should call action when item clicked', async () => {
    const mockAction = jest.fn()
    render(
      <DropdownView items={createItems(mockAction)} />
    )

    const anchor = document.querySelector('.menu-anchor')
    await userEvent.click(anchor!)
    await userEvent.click(screen.getByText('Item 1'))

    expect(mockAction).toHaveBeenCalledTimes(1)
  })

  it('should close menu when item clicked', async () => {
    const mockAction = jest.fn()
    render(
      <DropdownView items={createItems(mockAction)} />
    )

    const anchor = document.querySelector('.menu-anchor')
    await userEvent.click(anchor!)
    expect(document.querySelector('.menu-showing')).toBeInTheDocument()

    await userEvent.click(screen.getByText('Item 1'))
    expect(document.querySelector('.menu-hidden')).toBeInTheDocument()
  })

  it('should render separator items', () => {
    const items = [
      { name: 'Before' },
      { separator: true },
      { name: 'After' }
    ]
    render(
      <DropdownView items={items} />
    )

    expect(document.querySelector('.separator')).toBeInTheDocument()
  })

  it('should disable items without action', () => {
    const items = [
      { name: 'No Action' }
    ]
    render(
      <DropdownView items={items} />
    )

    expect(document.querySelector('.disabled')).toBeInTheDocument()
  })

  it('should disable items when enabled is false', () => {
    const items = [
      { name: 'Disabled', action: jest.fn(), enabled: false }
    ]
    render(
      <DropdownView items={items} />
    )

    expect(document.querySelector('.disabled')).toBeInTheDocument()
  })

  it('should disable items when enabled function returns false', () => {
    const items = [
      { name: 'Disabled', action: jest.fn(), enabled: () => false }
    ]
    render(
      <DropdownView items={items} />
    )

    expect(document.querySelector('.disabled')).toBeInTheDocument()
  })

  it('should close menu when Escape key pressed', async () => {
    render(
      <DropdownView items={createItems()} />
    )

    const anchor = document.querySelector('.menu-anchor')
    await userEvent.click(anchor!)
    expect(document.querySelector('.menu-showing')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(document.querySelector('.menu-hidden')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    render(
      <DropdownView items={createItems()} className="custom-dropdown" />
    )

    expect(document.querySelector('.custom-dropdown')).toBeInTheDocument()
  })

  it('should apply custom menuAnchorClassName', () => {
    render(
      <DropdownView items={createItems()} menuAnchorClassName="custom-anchor" />
    )

    expect(document.querySelector('.custom-anchor')).toBeInTheDocument()
  })

  it('should render custom menuAnchor', () => {
    render(
      <DropdownView items={createItems()} menuAnchor={<span data-testid="custom-anchor">Click Me</span>} />
    )

    expect(screen.getByTestId('custom-anchor')).toBeInTheDocument()
    expect(screen.getByText('Click Me')).toBeInTheDocument()
  })
})
