import React, { useState, useEffect, useRef } from 'react'
import $ from 'jquery'
import _ from 'lodash'
import { CloudMetadata, IListOptions, ProviderInterface, ECapabilities } from '../providers/provider-interface'
import tr from '../utils/translate'

// FileListFile component
interface FileListFileProps {
  metadata: CloudMetadata
  selected: boolean
  isSubFolder: boolean
  fileSelected: (metadata: CloudMetadata) => void
  fileConfirmed: () => void
}

const FileListFile: React.FC<FileListFileProps> = ({
  metadata,
  selected,
  isSubFolder,
  fileSelected,
  fileConfirmed
}) => {
  const lastClickRef = useRef(0)

  const handleFileSelected = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const now = new Date().getTime()
    fileSelected(metadata)
    if (now - lastClickRef.current <= 250) {
      fileConfirmed()
    }
    lastClickRef.current = now
  }

  const getIconClass = () => {
    if (metadata.type === CloudMetadata.Folder) return 'icon-inspectorArrow-collapse'
    if (metadata.type === CloudMetadata.File) return 'icon-noteTool'
    return ''
  }

  const selectableClass = metadata.type !== CloudMetadata.Label ? 'selectable' : ''
  const selectedClass = selected ? 'selected' : ''
  const subFolderClass = isSubFolder ? 'subfolder' : ''

  return (
    <div
      className={`${selectableClass} ${selectedClass} ${subFolderClass}`}
      title={metadata.description || undefined}
      onClick={metadata.type !== CloudMetadata.Label ? handleFileSelected : undefined}
    >
      <i className={getIconClass()} />
      {metadata.name}
    </div>
  )
}

// FileList component
interface FileListProps {
  provider: ProviderInterface
  folder: CloudMetadata | null
  selectedFile: CloudMetadata | null
  list: CloudMetadata[]
  listLoaded: (list: CloudMetadata[]) => void
  fileSelected: (metadata: CloudMetadata | null) => void
  fileConfirmed: () => void
  client: {
    alert: (message: string) => void
  }
  overrideMessage: React.ReactNode | null
  listOptions?: IListOptions
}

const FileList: React.FC<FileListProps> = ({
  provider,
  folder,
  selectedFile,
  list,
  listLoaded,
  fileSelected,
  fileConfirmed,
  client,
  overrideMessage,
  listOptions
}) => {
  const [loading, setLoading] = useState(true)
  const isMountedRef = useRef(true)
  const prevFolderRef = useRef<CloudMetadata | null>(folder)

  const load = (targetFolder: CloudMetadata | null) => {
    setLoading(true)
    provider.list(targetFolder as CloudMetadata, (err: string | null, loadedList?: CloudMetadata[]) => {
      // asynchronous callback may be called after dialog has been dismissed
      if (isMountedRef.current) {
        setLoading(false)
      }
      if (err) {
        client.alert(err)
        return
      }
      listLoaded(loadedList ?? [])
    }, listOptions)
  }

  useEffect(() => {
    isMountedRef.current = true
    load(folder)
    return () => {
      isMountedRef.current = false
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (folder !== prevFolderRef.current) {
      load(folder)
      prevFolderRef.current = folder
    }
  }, [folder]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleParentSelected = () => {
    fileSelected(folder?.parent ?? null)
  }

  const handleFileSelected = (metadata: CloudMetadata) => {
    if (!loading) {
      fileSelected(metadata)
    }
  }

  const handleFileConfirmed = () => {
    if (!loading) {
      fileConfirmed()
    }
  }

  const isSubFolder = folder != null
  let listContent: React.ReactNode[] = []

  if (!loading) {
    if (isSubFolder && folder) {
      listContent.push(
        <div key="parent" className="selectable" onClick={handleParentSelected}>
          <i className="icon-paletteArrow-collapse" />
          {folder.name}
        </div>
      )
    }
    const fileItems = list.map((metadata: CloudMetadata, i: number) => (
      <FileListFile
        key={i}
        metadata={metadata}
        selected={selectedFile === metadata}
        fileSelected={handleFileSelected}
        fileConfirmed={handleFileConfirmed}
        isSubFolder={isSubFolder}
      />
    ))
    listContent = listContent.concat(fileItems)
  }

  return (
    <div className="filelist">
      {loading ? (
        <div key="loading">{tr("~FILE_DIALOG.LOADING")}</div>
      ) : (
        overrideMessage || listContent
      )}
    </div>
  )
}

// FileDialogTab component
interface DialogData {
  action: string
  title: string
  data?: {
    extension?: string
  }
  callback?: (metadata: CloudMetadata) => void
}

interface FileDialogTabProps {
  dialog: DialogData
  close: () => void
  client: {
    state: {
      metadata?: CloudMetadata
      currentContent?: any
    }
    alert: (message: string, title?: string) => void
    confirm: (message: string, callback: () => void) => void
  }
  provider: ProviderInterface
}

interface FileDialogTabState {
  folder: CloudMetadata | null
  metadata: CloudMetadata | null
  filename: string
  list: CloudMetadata[]
  search: string
  authorized: boolean
}

const FileDialogTab: React.FC<FileDialogTabProps> = ({ dialog, close, client, provider }) => {
  const isMountedRef = useRef(true)
  const isAuthorizedRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const isOpen = () => dialog.action === 'openFile'
  const isExport = () => dialog.action === 'saveSecondaryFileAs'

  const getSaveMetadata = (): CloudMetadata | null => {
    const saveMetadata = client.state.metadata ? _.clone(client.state.metadata) : null
    if (saveMetadata) {
      if (provider === saveMetadata.provider) {
        saveMetadata.providerData = _.cloneDeep(saveMetadata.providerData)
      } else {
        saveMetadata.provider = null
        saveMetadata.providerData = null
        ;(saveMetadata as any).forceSaveDialog = false
      }
    }
    return saveMetadata
  }

  const getInitialState = (): FileDialogTabState => {
    const initialFolder = client.state.metadata?.parent ?? null
    const metadata = isOpen() ? null : getSaveMetadata()
    const filename = metadata?.name || ''

    let search = ''
    if (!isOpen()) {
      search = filename || tr("~MENUBAR.UNTITLED_DOCUMENT")
      if (isExport() && dialog.data?.extension) {
        search = CloudMetadata.newExtension(search, dialog.data.extension)
      }
    }

    return {
      folder: null, // Start with null folder for initial load
      metadata,
      filename,
      list: [],
      search,
      authorized: false
    }
  }

  const [state, setState] = useState<FileDialogTabState>(getInitialState)

  useEffect(() => {
    isMountedRef.current = true

    const setAuthorization = (authorized: boolean) => {
      isAuthorizedRef.current = authorized
      if (isMountedRef.current) {
        setState(prev => ({ ...prev, authorized }))
      }
    }

    // listen for logouts (Google Drive provider)
    // Note: onAuthorizationChange is only available on some providers
    const providerAny = provider as any
    providerAny.onAuthorizationChange?.((authorized: boolean) => {
      if (isAuthorizedRef.current && !authorized) {
        setState(getInitialState())
      }
      setAuthorization(authorized)
    })

    provider.authorized(setAuthorization)

    return () => {
      providerAny.onAuthorizationChange?.(null)
      isMountedRef.current = false
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const getStateForFolder = (folder: CloudMetadata | null): Partial<FileDialogTabState> => {
    const metadata = isOpen() ? state.metadata : getSaveMetadata()

    if (metadata != null) {
      metadata.parent = folder ?? undefined
    }

    const newState: Partial<FileDialogTabState> = {
      folder,
      metadata,
      filename: "",
      list: []
    }

    if (isOpen()) {
      newState.search = ""
    }

    return newState
  }

  const searchChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    const search = e.target.value
    setState(prev => ({
      ...prev,
      search,
      filename: '',
      metadata: null
    }))
  }

  const listLoaded = (list: CloudMetadata[]) => {
    if (isMountedRef.current) {
      setState(prev => ({ ...prev, list }))
    }
  }

  const fileSelected = (metadata: CloudMetadata | null) => {
    if (metadata?.type === CloudMetadata.Folder) {
      setState(prev => ({ ...prev, ...getStateForFolder(metadata) }))
    } else if (metadata?.type === CloudMetadata.File) {
      const newState: Partial<FileDialogTabState> = { filename: metadata.name, metadata }
      if (!isOpen()) {
        newState.search = metadata.name
      }
      setState(prev => ({ ...prev, ...newState }))
    } else {
      setState(prev => ({ ...prev, ...getStateForFolder(null) }))
    }
  }

  const confirmed = (metadata: CloudMetadata) => {
    // ensure the metadata provider is the currently-showing tab
    if (metadata.provider !== provider) {
      metadata.provider = provider
      metadata.providerData = {}
    }
    dialog.callback?.(metadata)
    setState(prev => ({ ...prev, metadata }))
    close()
  }

  const findMetadata = (filename: string, list: CloudMetadata[], extension?: string): CloudMetadata | null => {
    const checkExtension = extension !== undefined
    const filenameWithExtension = checkExtension && CloudMetadata.newExtension(filename, extension)
    for (const metadata of list) {
      const found = checkExtension
        ? metadata.filename === filenameWithExtension
        : metadata.name === filename
      if (found) {
        return metadata
      }
    }
    return null
  }

  const finalConfirmedFilename = () => {
    return isOpen() ? state.filename : (state.filename || state.search || "")
  }

  const confirmDisabled = () => {
    return provider.fileDialogDisabled(state.folder as CloudMetadata) || (finalConfirmedFilename().length === 0) || (isOpen() && !state.metadata)
  }

  const confirm = () => {
    const filename = $.trim(finalConfirmedFilename())
    const existingMetadata = findMetadata(filename, state.list, dialog.data?.extension)
    let metadata = state.metadata || existingMetadata

    // a bit of a hack - on export clear the provider data if there is no matching file found so we don't
    // accidentally override the original saved file
    if (isExport() && metadata && !existingMetadata) {
      metadata.providerData = {}
    }

    if (metadata) {
      if (isOpen()) {
        confirmed(metadata)
      } else if (existingMetadata) {
        client.confirm(`Are you sure you want to overwrite ${existingMetadata.name}?`, () => confirmed(existingMetadata))
      } else {
        confirmed(metadata)
      }
    } else if (isOpen()) {
      client.alert(`${filename} not found`)
    } else {
      confirmed(new CloudMetadata({
        name: filename,
        type: CloudMetadata.File,
        parent: state.folder ?? undefined,
        provider
      }))
    }
  }

  const remove = () => {
    if (state.metadata && state.metadata.type !== CloudMetadata.Folder) {
      const filename = state.metadata.name ?? ''
      client.confirm(tr("~FILE_DIALOG.REMOVE_CONFIRM", { filename }), () => {
        provider.remove(state.metadata!, (err: any) => {
          if (!err) {
            client.alert(tr("~FILE_DIALOG.REMOVED_MESSAGE", { filename }), tr("~FILE_DIALOG.REMOVED_TITLE"))
            const list = state.list.slice(0)
            const index = list.indexOf(state.metadata!)
            list.splice(index, 1)
            setState(prev => ({
              ...prev,
              list,
              metadata: null,
              filename: '',
              search: ''
            }))
          }
        })
      })
    }
  }

  const cancel = () => {
    close()
  }

  const watchForEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.keyCode === 13 && !confirmDisabled()) {
      confirm()
    }
  }

  const clearListFilter = () => {
    setState(prev => ({ ...prev, search: "" }))
    inputRef.current?.focus()
  }

  const renderWhenAuthorized = () => {
    const disabled = confirmDisabled()
    const removeDisabled = state.metadata === null || state.metadata.type === CloudMetadata.Folder

    const isOpenAction = isOpen()
    const search = state.search || ""
    const lowerSearch = search.toLowerCase()
    const filtering = isOpenAction && search.length > 0
    const list = filtering
      ? state.list.filter((item: CloudMetadata) => item.name?.toLowerCase().indexOf(lowerSearch) !== -1)
      : state.list
    const listFiltered = list.length !== state.list.length

    const overrideMessage = filtering && listFiltered && list.length === 0
      ? <div>No files found matching "{search}"</div>
      : null

    // when exporting only show folders as we can't filter based on mimetypes like text/csv or image/png to show only those files
    const listOptions: IListOptions | undefined = isExport() && dialog.data?.extension ? { extension: dialog.data.extension } : undefined

    return (
      <div className="dialogTab">
        <input
          type="text"
          value={search}
          placeholder={tr(isOpenAction ? "~FILE_DIALOG.FILTER" : "~FILE_DIALOG.FILENAME")}
          autoFocus
          onChange={searchChanged}
          onKeyDown={watchForEnter}
          ref={inputRef}
        />
        {listFiltered && (
          <div className="dialogClearFilter" onClick={clearListFilter}>X</div>
        )}
        <FileList
          provider={provider}
          folder={state.folder}
          selectedFile={state.metadata}
          fileSelected={fileSelected}
          fileConfirmed={confirm}
          list={list}
          listLoaded={listLoaded}
          client={client}
          overrideMessage={overrideMessage}
          listOptions={listOptions}
        />
        <div className="buttons">
          <button
            onClick={confirm}
            disabled={disabled}
            className={disabled ? 'disabled' : ''}
          >
            {isOpenAction ? tr("~FILE_DIALOG.OPEN") : tr("~FILE_DIALOG.SAVE")}
          </button>
          {provider.can(ECapabilities.remove) && (
            <button
              onClick={remove}
              disabled={removeDisabled}
              className={removeDisabled ? 'disabled' : ''}
            >
              {tr("~FILE_DIALOG.REMOVE")}
            </button>
          )}
          <button onClick={cancel}>{tr("~FILE_DIALOG.CANCEL")}</button>
        </div>
      </div>
    )
  }

  // Main render
  // Note: authorized() is typed as void but actually returns a boolean when called without a callback
  const providerAny = provider as any
  if (!provider.isAuthorizationRequired() || providerAny.authorized()) {
    // the google drive provider renders its own dialog tab views that need to load after authorization
    if (providerAny.renderFileDialogTabView) {
      return providerAny.renderFileDialogTabView({ ...{ dialog, close, client, provider }, onConfirm: confirmed, onCancel: cancel })
    }
    return renderWhenAuthorized()
  } else {
    return provider.renderAuthorizationDialog()
  }
}

export default FileDialogTab
