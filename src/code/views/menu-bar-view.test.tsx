import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import MenuBarViewComponent from './menu-bar-view'

// Cast to override the inferred props type for testing
const MenuBarView = MenuBarViewComponent as unknown as React.ComponentType<{
  client: {
    appOptions: {
      appIcon?: string
      ui: {
        menuBar?: {
          subMenuExpandIcon?: string
        }
      }
    }
    state: {
      metadata?: {
        name?: string
      }
    }
    _ui: {
      menu: {
        options?: {
          menuAnchorIcon?: string
          menuAnchorName?: string
        }
      }
      listen: (callback: (event: any) => void) => void
    }
    rename: (metadata: any, filename: string) => void
    setInitialFilename: (filename: string) => void
    changeLanguage: (langCode: string, callback: () => void) => void
  }
  options: {
    info?: string
    onInfoClick?: () => void
    languageMenu?: {
      options: Array<{ langCode: string, label?: string, flag?: string }>
      onLangChanged?: () => void
      withBorder?: boolean
    }
    languageAnchorIcon?: string
    otherMenus?: Array<{
      menu: any[]
      menuAnchorIcon?: string
      menuAnchorName?: string
      className?: string
    }>
    clientToolBarPosition?: string
  }
  items: Array<{
    name: string
    action?: () => void
    enabled?: boolean
  }>
  filename?: string
  provider?: {
    isAuthorizationRequired: () => boolean
    authorized: () => boolean
    renderUser: () => React.ReactNode
  }
  fileStatus?: {
    type: string
    message: string
  }
}>

// Mock console.log to suppress the language log message
const originalConsoleLog = console.log
beforeAll(() => {
  console.log = jest.fn()
})
afterAll(() => {
  console.log = originalConsoleLog
})

// Use fake timers to handle setTimeout in focusFilename
beforeEach(() => {
  jest.useFakeTimers()
})
afterEach(() => {
  // Clear any pending timers without running them (avoids errors from unmounted components)
  jest.clearAllTimers()
  jest.useRealTimers()
})

describe('MenuBarView', () => {
  const createMockClient = (overrides = {}) => ({
    appOptions: {
      appIcon: '/test-icon.png',
      ui: {
        menuBar: {}
      }
    },
    state: {
      metadata: {
        name: 'test-document'
      }
    },
    _ui: {
      menu: {
        options: {
          menuAnchorIcon: '/menu-icon.png',
          menuAnchorName: 'File'
        }
      },
      listen: jest.fn()
    },
    rename: jest.fn(),
    setInitialFilename: jest.fn(),
    changeLanguage: jest.fn(),
    ...overrides
  })

  const createMockOptions = (overrides = {}) => ({
    info: undefined,
    onInfoClick: undefined,
    languageMenu: undefined,
    otherMenus: undefined,
    ...overrides
  })

  const createMockItems = () => [
    { name: 'New', action: jest.fn() },
    { name: 'Open', action: jest.fn() },
    { name: 'Save', action: jest.fn() }
  ]

  it('should render menu bar structure', () => {
    render(
      <MenuBarView
        client={createMockClient()}
        options={createMockOptions()}
        items={createMockItems()}
      />
    )

    expect(document.querySelector('.menu-bar')).toBeInTheDocument()
    expect(document.querySelector('.menu-bar-left')).toBeInTheDocument()
    expect(document.querySelector('.menu-bar-center')).toBeInTheDocument()
    expect(document.querySelector('.menu-bar-right')).toBeInTheDocument()
  })

  it('should render filename when provided', () => {
    render(
      <MenuBarView
        client={createMockClient()}
        options={createMockOptions()}
        items={createMockItems()}
        filename="my-document"
      />
    )

    expect(screen.getByText('my-document')).toBeInTheDocument()
  })

  it('should render "Untitled Document" when no filename provided', () => {
    render(
      <MenuBarView
        client={createMockClient()}
        options={createMockOptions()}
        items={createMockItems()}
        filename=""
      />
    )

    expect(screen.getByText('Untitled Document')).toBeInTheDocument()
  })

  it('should render file menu with items', () => {
    render(
      <MenuBarView
        client={createMockClient()}
        options={createMockOptions()}
        items={createMockItems()}
      />
    )

    expect(screen.getByText('File')).toBeInTheDocument()
    expect(screen.getByText('New')).toBeInTheDocument()
    expect(screen.getByText('Open')).toBeInTheDocument()
    expect(screen.getByText('Save')).toBeInTheDocument()
  })

  it('should enter edit mode when filename clicked', () => {
    render(
      <MenuBarView
        client={createMockClient()}
        options={createMockOptions()}
        items={createMockItems()}
        filename="test-doc"
      />
    )

    const filenameSpan = screen.getByText('test-doc')
    fireEvent.click(filenameSpan)

    // After click, should have an input for editing
    const input = document.querySelector('.menu-bar-content-filename input') as HTMLInputElement
    expect(input).toBeInTheDocument()
    expect(input.value).toBe('test-doc')
  })

  it('should call rename when Enter pressed during edit', () => {
    const mockClient = createMockClient()
    render(
      <MenuBarView
        client={mockClient}
        options={createMockOptions()}
        items={createMockItems()}
        filename="old-name"
      />
    )

    // Click filename to enter edit mode
    const filenameSpan = screen.getByText('old-name')
    fireEvent.click(filenameSpan)

    // Advance timers to complete the setTimeout for focus
    jest.runAllTimers()

    // Get the input and change value
    const input = document.querySelector('.menu-bar-content-filename input') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'new-name' } })

    // Press Enter
    fireEvent.keyDown(input, { keyCode: 13 })

    expect(mockClient.rename).toHaveBeenCalledWith(
      mockClient.state.metadata,
      'new-name'
    )
  })

  it('should cancel edit when Escape pressed', () => {
    render(
      <MenuBarView
        client={createMockClient()}
        options={createMockOptions()}
        items={createMockItems()}
        filename="original-name"
      />
    )

    // Click filename to enter edit mode
    const filenameSpan = screen.getByText('original-name')
    fireEvent.click(filenameSpan)

    // Advance timers to complete the setTimeout for focus
    jest.runAllTimers()

    // Get the input and change value
    const input = document.querySelector('.menu-bar-content-filename input') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'changed-name' } })

    // Press Escape
    fireEvent.keyDown(input, { keyCode: 27 })

    // Should exit edit mode and show original name
    expect(screen.getByText('original-name')).toBeInTheDocument()
    expect(document.querySelector('.menu-bar-content-filename input')).not.toBeInTheDocument()
  })

  it('should render app logo', () => {
    render(
      <MenuBarView
        client={createMockClient()}
        options={createMockOptions()}
        items={createMockItems()}
      />
    )

    const logo = document.querySelector('.app-logo') as HTMLImageElement
    expect(logo).toBeInTheDocument()
    expect(logo.src).toContain('test-icon.png')
  })

  it('should call onInfoClick when logo clicked', () => {
    const mockOnInfoClick = jest.fn()
    render(
      <MenuBarView
        client={createMockClient()}
        options={createMockOptions({ onInfoClick: mockOnInfoClick })}
        items={createMockItems()}
      />
    )

    const logo = document.querySelector('.app-logo') as HTMLImageElement
    fireEvent.click(logo)

    expect(mockOnInfoClick).toHaveBeenCalledTimes(1)
  })

  it('should render info text when provided', () => {
    render(
      <MenuBarView
        client={createMockClient()}
        options={createMockOptions({ info: 'App Version 1.0' })}
        items={createMockItems()}
      />
    )

    expect(screen.getByText('App Version 1.0')).toBeInTheDocument()
  })

  it('should render file status when provided', () => {
    render(
      <MenuBarView
        client={createMockClient()}
        options={createMockOptions()}
        items={createMockItems()}
        fileStatus={{ type: 'saving', message: 'Saving...' }}
      />
    )

    expect(screen.getByText('Saving...')).toBeInTheDocument()
    expect(document.querySelector('.menu-bar-file-status.saving')).toBeInTheDocument()
  })

  it('should render language menu when provided', () => {
    const languageMenu = {
      options: [
        { langCode: 'en', label: 'English' },
        { langCode: 'es', label: 'Español' }
      ],
      onLangChanged: jest.fn()
    }

    render(
      <MenuBarView
        client={createMockClient()}
        options={createMockOptions({ languageMenu, languageAnchorIcon: '/lang-icon.png' })}
        items={createMockItems()}
      />
    )

    expect(document.querySelector('.lang-menu')).toBeInTheDocument()
  })

  it('should render other menus when provided', () => {
    const otherMenus = [{
      menu: [{ name: 'Settings', action: jest.fn() }],
      menuAnchorIcon: '/help-icon.png',
      menuAnchorName: 'Options',
      className: 'options-menu'
    }]

    render(
      <MenuBarView
        client={createMockClient()}
        options={createMockOptions({ otherMenus })}
        items={createMockItems()}
      />
    )

    // Check that the menu anchor is rendered
    expect(screen.getByText('Options')).toBeInTheDocument()
    // Check that menu has correct class
    expect(document.querySelector('.options-menu')).toBeInTheDocument()
  })

  it('should render authorized user when provider is authorized', () => {
    const mockProvider = {
      isAuthorizationRequired: () => true,
      authorized: () => true,
      renderUser: () => <span data-testid="user-info">User Name</span>
    }

    render(
      <MenuBarView
        client={createMockClient()}
        options={createMockOptions()}
        items={createMockItems()}
        provider={mockProvider}
      />
    )

    expect(screen.getByTestId('user-info')).toBeInTheDocument()
    expect(screen.getByText('User Name')).toBeInTheDocument()
  })

  it('should not render user when provider is not authorized', () => {
    const mockProvider = {
      isAuthorizationRequired: () => true,
      authorized: () => false,
      renderUser: () => <span data-testid="user-info">User Name</span>
    }

    render(
      <MenuBarView
        client={createMockClient()}
        options={createMockOptions()}
        items={createMockItems()}
        provider={mockProvider}
      />
    )

    expect(screen.queryByTestId('user-info')).not.toBeInTheDocument()
  })

  it('should apply toolbar-position-left class when specified', () => {
    render(
      <MenuBarView
        client={createMockClient()}
        options={createMockOptions({ clientToolBarPosition: 'left' })}
        items={createMockItems()}
      />
    )

    expect(document.querySelector('.menu-bar.toolbar-position-left')).toBeInTheDocument()
  })

  it('should not call rename when filename is empty after edit', () => {
    const mockClient = createMockClient()
    render(
      <MenuBarView
        client={mockClient}
        options={createMockOptions()}
        items={createMockItems()}
        filename="original"
      />
    )

    // Click filename to enter edit mode
    fireEvent.click(screen.getByText('original'))

    // Advance timers to complete the setTimeout for focus
    jest.runAllTimers()

    // Clear the input
    const input = document.querySelector('.menu-bar-content-filename input') as HTMLInputElement
    fireEvent.change(input, { target: { value: '' } })

    // Press Enter with empty value
    fireEvent.keyDown(input, { keyCode: 13 })

    // Should not call rename
    expect(mockClient.rename).not.toHaveBeenCalled()
  })

  it('should register UI listener on mount', () => {
    const mockListen = jest.fn()
    const mockClient = createMockClient({
      _ui: {
        menu: { options: {} },
        listen: mockListen
      }
    })

    render(
      <MenuBarView
        client={mockClient}
        options={createMockOptions()}
        items={createMockItems()}
      />
    )

    expect(mockListen).toHaveBeenCalledTimes(1)
  })
})
