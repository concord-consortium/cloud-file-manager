import { act, render, screen } from '@testing-library/react'
import React from 'react'
import AlertDialogView from '../alert-dialog-view'
import ConfirmDialogView from '../confirm-dialog-view'
import RenameDialogView from '../rename-dialog-view'
import DownloadDialogView from '../download-dialog-view'
import ShareDialogView from '../share-dialog-view'
import BlockingModalView from '../blocking-modal-view'
import SelectInteractiveStateDialog from '../select-interactive-state-dialog-view'
import ProviderTabbedDialog from '../provider-tabbed-dialog-view'
import ImportTabbedDialog from '../import-tabbed-dialog-view'
import DocumentStoreProvider from '../../providers/document-store-provider'
import GoogleDriveProvider from '../../providers/google-drive-provider'
import ReadOnlyProvider from '../../providers/readonly-provider'

const createMockClient = () => ({
  alert: jest.fn(),
  confirm: jest.fn(),
  confirmDialog: jest.fn(),
  isShared: () => false,
  getDownloadUrl: () => '#',
  toggleShare: jest.fn(),
  shareUpdate: jest.fn(),
  getCurrentUrl: () => 'https://example.org',
  state: {
    metadata: {
      provider: { name: 'testProvider' }
    }
  }
})

const createReadOnlyProvider = (client: any) => {
  return new ReadOnlyProvider({ json: [], alphabetize: false } as any, client)
}

describe('Dialog testid sanity', () => {
  it('renders modal dialog wrappers', () => {
    render(<AlertDialogView message="Alert" />)
    expect(screen.getByTestId('cfm-dialog-alert')).toBeInTheDocument()

    render(<ConfirmDialogView message="Confirm" confirmKind="close-file" />)
    expect(screen.getByTestId('cfm-dialog-confirm-close-file')).toBeInTheDocument()

    render(<RenameDialogView />)
    expect(screen.getByTestId('cfm-dialog-rename')).toBeInTheDocument()

    render(
      <DownloadDialogView
        filename="file"
        content={{}}
        client={{ isShared: () => false, getDownloadUrl: () => '#' }}
      />
    )
    expect(screen.getByTestId('cfm-dialog-download')).toBeInTheDocument()

    render(
      <ShareDialogView
        currentBaseUrl="https://example.org"
        isShared={false}
        onAlert={jest.fn()}
        onToggleShare={jest.fn((cb) => cb?.(null))}
        onUpdateShare={jest.fn()}
        close={jest.fn()}
      />
    )
    expect(screen.getByTestId('cfm-dialog-share')).toBeInTheDocument()
  })

  it('renders select-state and blocking modal wrappers', () => {
    const state = {
      interactiveState: {},
      updatedAt: new Date().toISOString(),
      externalReportUrl: 'https://example.org/report',
      pageNumber: 1,
      pageName: 'Page 1',
      activityName: 'Activity'
    }

    render(
      <SelectInteractiveStateDialog
        state1={state as any}
        state2={state as any}
        interactiveStateAvailable={true}
      />
    )
    expect(screen.getByTestId('cfm-dialog-select-state')).toBeInTheDocument()

    render(<BlockingModalView title="Working" message="Loading" />)
    expect(screen.getByTestId('cfm-blocking-modal')).toBeInTheDocument()
  })

  it('renders provider-tabbed and import dialog wrappers', async () => {
    const client = createMockClient() as any
    const provider = createReadOnlyProvider(client) as any
    client.state.availableProviders = [provider]

    await act(async () => {
      render(
        <ProviderTabbedDialog
          client={client}
          dialog={{ action: 'openFile', title: '~DIALOG.OPEN' }}
          close={jest.fn()}
        />
      )
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    expect(screen.getByTestId('cfm-dialog-open')).toBeInTheDocument()

    render(
      <ImportTabbedDialog
        client={{ alert: jest.fn() }}
        dialog={{ callback: jest.fn() }}
        close={jest.fn()}
      />
    )
    expect(screen.getByTestId('cfm-dialog-import')).toBeInTheDocument()
  })

  it('renders provider auth panels', () => {
    const client = createMockClient() as any

    const docStoreProvider = new DocumentStoreProvider({ deprecationPhase: 0 } as any, client)
    render(docStoreProvider.renderAuthorizationDialog() as any)
    expect(screen.getByTestId('cfm-document-store-auth-panel')).toBeInTheDocument()

    const googleProvider = new GoogleDriveProvider({ apiKey: 'key', clientId: 'id', appId: 'app' } as any, client)
    render(googleProvider.renderAuthorizationDialog() as any)
    expect(screen.getByTestId('cfm-google-drive-auth-panel')).toBeInTheDocument()
  })

  it('renders confirm fallback when no kind is passed', () => {
    render(<ConfirmDialogView message="Generic" />)
    expect(screen.getByTestId('cfm-dialog-confirm')).toBeInTheDocument()
    expect(screen.getByTestId('cfm-dialog-confirm-message')).toBeInTheDocument()
    expect(screen.getByTestId('cfm-dialog-confirm-yes-button')).toBeInTheDocument()
    expect(screen.getByTestId('cfm-dialog-confirm-no-button')).toBeInTheDocument()
  })

  it('renders save-family and other provider-tabbed dialog wrappers', async () => {
    const actions: Array<[string, string]> = [
      ['saveFile', 'cfm-dialog-save'],
      ['saveFileAs', 'cfm-dialog-save-as'],
      ['saveSecondaryFileAs', 'cfm-dialog-export'],
      ['createCopy', 'cfm-dialog-make-copy'],
      ['selectProvider', 'cfm-dialog-select-provider']
    ]
    for (const [action, testId] of actions) {
      const client = createMockClient() as any
      const provider = createReadOnlyProvider(client) as any
      client.state.availableProviders = [provider]
      await act(async () => {
        render(
          <ProviderTabbedDialog
            client={client}
            dialog={{ action, title: `~DIALOG.${action.toUpperCase()}` }}
            close={jest.fn()}
          />
        )
        await new Promise((resolve) => setTimeout(resolve, 0))
      })
      expect(screen.getByTestId(testId)).toBeInTheDocument()
    }
  })

  it('exposes the universal cfm-modal-container sentinel on every modal, including stacked modals', () => {
    render(<AlertDialogView message="Alert on top" />)
    render(<RenameDialogView />)
    // Two modals mounted simultaneously — cfm-modal-container should appear twice.
    const containers = screen.getAllByTestId('cfm-modal-container')
    expect(containers.length).toBeGreaterThanOrEqual(2)
  })
})
