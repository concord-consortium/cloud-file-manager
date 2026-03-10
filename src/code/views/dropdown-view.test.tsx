import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import DropdownView from './dropdown-view'

describe('DropdownView', () => {
  const user = userEvent.setup()

  const createItems = (action?: jest.Mock) => [
    { name: 'Item 1', action },
    { name: 'Item 2', action },
    { name: 'Item 3', action }
  ]

  const openMenu = async () => {
    const anchor = document.querySelector('.menu-anchor')
    await act(async () => {
      await user.click(anchor!)
    })
  }

  it('should render nothing when items array is empty', () => {
    render(
      <DropdownView items={[]} />
    )
    expect(document.querySelector('.menu-anchor')).not.toBeInTheDocument()
  })

  it('should render menu items when opened', async () => {
    render(
      <DropdownView items={createItems()} />
    )
    await openMenu()

    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 2')).toBeInTheDocument()
    expect(screen.getByText('Item 3')).toBeInTheDocument()
  })

  it('should start with menu closed', () => {
    render(
      <DropdownView items={createItems()} />
    )
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('should show menu when anchor clicked', async () => {
    render(
      <DropdownView items={createItems()} />
    )
    await openMenu()

    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('should close menu when clicking outside', async () => {
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <DropdownView items={createItems()} />
      </div>
    )

    await openMenu()
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await act(async () => {
      await user.click(screen.getByTestId('outside'))
    })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('should call action when item clicked', async () => {
    const mockAction = jest.fn()
    render(
      <DropdownView items={createItems(mockAction)} />
    )

    await openMenu()
    await act(async () => {
      await user.click(screen.getByText('Item 1'))
    })

    expect(mockAction).toHaveBeenCalledTimes(1)
  })

  it('should close menu when item clicked', async () => {
    const mockAction = jest.fn()
    render(
      <DropdownView items={createItems(mockAction)} />
    )

    await openMenu()
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await act(async () => {
      await user.click(screen.getByText('Item 1'))
    })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('should render separator items', async () => {
    const items = [
      { name: 'Before', action: jest.fn() },
      { separator: true },
      { name: 'After', action: jest.fn() }
    ]
    render(
      <DropdownView items={items} />
    )

    await openMenu()
    expect(screen.getByRole('separator')).toBeInTheDocument()
  })

  it('should disable items without action', async () => {
    const items = [
      { name: 'No Action' }
    ]
    render(
      <DropdownView items={items} />
    )

    await openMenu()
    const menuItem = screen.getByRole('menuitem', { name: 'No Action' })
    expect(menuItem).toHaveAttribute('aria-disabled', 'true')
  })

  it('should disable items when enabled is false', async () => {
    const items = [
      { name: 'Disabled', action: jest.fn(), enabled: false }
    ]
    render(
      <DropdownView items={items} />
    )

    await openMenu()
    const menuItem = screen.getByRole('menuitem', { name: 'Disabled' })
    expect(menuItem).toHaveAttribute('aria-disabled', 'true')
  })

  it('should disable items when enabled function returns false', async () => {
    const items = [
      { name: 'Disabled', action: jest.fn(), enabled: () => false }
    ]
    render(
      <DropdownView items={items} />
    )

    await openMenu()
    const menuItem = screen.getByRole('menuitem', { name: 'Disabled' })
    expect(menuItem).toHaveAttribute('aria-disabled', 'true')
  })

  it('should close menu when Escape key pressed', async () => {
    render(
      <DropdownView items={createItems()} />
    )

    await openMenu()
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await act(async () => {
      await user.keyboard('{Escape}')
    })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('should apply custom className', () => {
    render(
      <DropdownView items={createItems()} className="custom-dropdown" />
    )

    expect(document.querySelector('.custom-dropdown')).toBeInTheDocument()
  })

  it('should apply custom triggerClassName', () => {
    render(
      <DropdownView items={createItems()} triggerClassName="custom-trigger" />
    )

    expect(document.querySelector('.custom-trigger')).toBeInTheDocument()
  })

  it('should render custom menuAnchor', () => {
    render(
      <DropdownView items={createItems()} menuAnchor={<span data-testid="custom-anchor">Click Me</span>} />
    )

    expect(screen.getByTestId('custom-anchor')).toBeInTheDocument()
    expect(screen.getByText('Click Me')).toBeInTheDocument()
  })

  it('should navigate items with arrow keys', async () => {
    const items = [
      { name: 'First', action: jest.fn() },
      { name: 'Second', action: jest.fn() },
      { name: 'Third', action: jest.fn() }
    ]
    render(<DropdownView items={items} />)

    await openMenu()

    // Arrow down moves focus through items
    await act(async () => {
      await user.keyboard('{ArrowDown}')
    })
    expect(document.activeElement).toHaveTextContent('First')

    await act(async () => {
      await user.keyboard('{ArrowDown}')
    })
    expect(document.activeElement).toHaveTextContent('Second')

    await act(async () => {
      await user.keyboard('{ArrowDown}')
    })
    expect(document.activeElement).toHaveTextContent('Third')
  })

  it('should activate item with Enter key', async () => {
    const mockAction = jest.fn()
    const items = [
      { name: 'Action Item', action: mockAction }
    ]
    render(<DropdownView items={items} />)

    await openMenu()

    await act(async () => {
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{Enter}')
    })

    expect(mockAction).toHaveBeenCalledTimes(1)
  })

  it('should activate item with Space key', async () => {
    const mockAction = jest.fn()
    const items = [
      { name: 'Action Item', action: mockAction }
    ]
    render(<DropdownView items={items} />)

    await openMenu()

    await act(async () => {
      await user.keyboard('{ArrowDown}')
      await user.keyboard(' ')
    })

    expect(mockAction).toHaveBeenCalledTimes(1)
  })

  it('should skip disabled items during keyboard navigation', async () => {
    const items = [
      { name: 'Enabled', action: jest.fn() },
      { name: 'Disabled', action: jest.fn(), enabled: false },
      { name: 'Also Enabled', action: jest.fn() }
    ]
    render(<DropdownView items={items} />)

    await openMenu()

    await act(async () => {
      await user.keyboard('{ArrowDown}')
    })
    expect(document.activeElement).toHaveTextContent('Enabled')

    // Should skip 'Disabled' and land on 'Also Enabled'
    await act(async () => {
      await user.keyboard('{ArrowDown}')
    })
    expect(document.activeElement).toHaveTextContent('Also Enabled')
  })

  it('should close menu and restore focus on Escape', async () => {
    render(<DropdownView items={createItems()} />)

    await openMenu()
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await act(async () => {
      await user.keyboard('{Escape}')
    })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    // React Aria restores focus to trigger in real browsers;
    // jsdom doesn't fully support this, so we verify the menu closed
  })

  it('should not call action on disabled item click', async () => {
    const mockAction = jest.fn()
    const items = [
      { name: 'Disabled Item', action: mockAction, enabled: false }
    ]
    render(<DropdownView items={items} />)

    await openMenu()
    await act(async () => {
      await user.click(screen.getByText('Disabled Item'))
    })

    expect(mockAction).not.toHaveBeenCalled()
  })

  it('should render submenu items', async () => {
    const subAction = jest.fn()
    const items = [
      { name: 'Parent', items: [
        { name: 'Sub Item 1', action: subAction },
        { name: 'Sub Item 2', action: jest.fn() }
      ]}
    ]
    render(<DropdownView items={items} />)

    await openMenu()
    expect(screen.getByText('Parent')).toBeInTheDocument()

    // Navigate to parent item and open submenu with ArrowRight
    await act(async () => {
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{ArrowRight}')
    })
    expect(screen.getByText('Sub Item 1')).toBeInTheDocument()
    expect(screen.getByText('Sub Item 2')).toBeInTheDocument()
  })

  it('should toggle menu closed when anchor clicked again', async () => {
    render(
      <DropdownView items={createItems()} />
    )

    await openMenu()
    expect(screen.getByRole('menu')).toBeInTheDocument()

    // Click anchor again — should close (CODAP-910)
    await openMenu()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
