This is an example of how the UI of a provider interacts with the document model. It is the code path that supports a user opening a local file. This traces the path through many functions from when the `openFileDialog` is called to when the `window.title` is set to the name of the file.

## Summary
- it starts out in `CloudFileManagerClient`
- `CloudFileManagerClient` fires an event that is handled by `AppView`
- a state change in `AppView` then causes `ProviderTabbedDialog` to render
- `ProviderTabbedDialog` gets the `LocalFileListTab` component from `LocalFileProvider`
- `LocalFileListTab` shows a file input element
- the input event handling saves the browser file object into `metadata.providerData.file` and calls back into `CloudFileManagerClient#openFile`
- this then goes into `LocalFileFileProvider#load` to read the content from browser file object and create the CloudContent.
- then a callback goes back into `CloudFileManagerClient` to finishing the opening logic

## Details

### `CloudFileManagerClient#openFileDialog(callback: OpenSaveCallback = null)`
- if `!this.state.dirty`
- call 
```javascript
this._ui.openFileDialog((metadata: CloudMetadata) => {
  return this.openFile(metadata, callback)
})
```
- Note: this is the definition of the callback that is eventually called by `LocalFileTabListView#openFile`

### `CloudFileManagerUI#openFileDialog(callback: UIEventCallback)`
- calls `_showProviderDialog('openFile', (tr('~DIALOG.OPEN')), callback)`

### `CloudFileManagerUI#_showProviderDialog(action: string, title: string, callback: UIEventCallback, data?: any)`
- fires an 'showProviderDialog' event with:
`this.listenerCallback(new CloudFileManagerUIEvent('showProviderDialog', { action, title, callback, data }))`

### `AppView#componentDidMount`
- adds a listener to `props.client._ui`
- when `event.type` is 'showProviderDialog'
- call `setState({providerDialog: event.data})`

### `AppView#render`
- when `state.providerDialog` is truthy
- call `renderDialogs`

### `AppView#renderDialogs`
- when `state.providerDialog` is truthy
- return `ProviderTabbedDialog({client: this.props.client, dialog: this.state.providerDialog, close: this.closeDialogs})`

### `ProviderTabbedDialog#render`
- when `props.dialog.action` is 'openFile' it sets:
  - `capability='list'`
  - `TabComponent=FileDialogTab`
- gets a filteredTabComponent with `provider.filterTabComponent(capability, TabComponent)`
- renders this component with:
```javascript
filteredTabComponent({
  client: this.props.client,
  dialog: this.props.dialog,
  close: this.props.close,
  provider
})
```

### `LocalFileProvider#filterTabComponent(capability: ECapabilities, defaultComponent: React.Component)`
If the capability is 'list' then the `LocalFileListTab` component is returned.

### `LocalFileTabListView#render`
`<input type='file' onChange={this.changed}>`

### `LocalFileTabListView#changed(e: any)`
makes sure there is only one file being opened
calls `openFile(e.target.files[0], 'select')`

### `LocalFileTabListView#openFile(file: any, via: any)`
constructs a CloudMetadata with:
```
{
  name: file.name.split('.')[0],
  type: CloudMetadata.File,
  parent: null,
  provider: this.props.provider,
  providerData: {
    file
  }
}
```
Then calls `props.dialog.callback(metadata, via)`, this callback is defined up in `CloudFileManagerClient#openFileDialog`

### `CloudFileManagerClient#openFile(metadata: CloudMetadata, callback: OpenSaveCallback = null)`
- checks that the provider can load this file
- fires `willOpenFile` event
- calls `metadata.provider.load(metadata, ...)`
- The `...` represents an inline callback which is described below
- The `callback` argument to `openFile` comes from `CloudFileManagerClient#openFileDialog`

### `LocalFileProvider#load(metadata: CloudMetadata, callback: ProviderLoadCallback)` 
- reads the content from the `metadata.providerData.file`
- creates a CloudContent from the result
- passes this CloudContent to: `callback(null, content)`

### `CloudFileManagerClient#openFile<anonymous callback>(err: string | null, content: any)`
- closes the current file
- calls `_filterLoadedContent(content)`
- calls `_fileOpened(content, metadata, {openedContent: content.clone()}, this._getHashParams(metadata))`
- calls the `callback` that was an argument to `CloudFileManagerClient#openFile` this callback comes from `CloudFileManagerClient#openFileDialog`
- calls `metadata.provider.fileOpened(content, metadata)`

### `CloudFileManagerClient#_fileOpened(content: any, metadata: CloudMetadata, additionalState?: any, hashParams: string = null)`
- calls `_updateState(content, metadata, additionalState, hashParams)`
- fires 'openedFile' event with `{content: content.getClientContent()}` with an inline callback
- TODO: describe the inline callback

### `CloudFileManagerClient#_updateState(content: any, metadata: CloudMetadata, additionalState: Partial<IClientState> = {}, hashParams: string = null)`
- sets the window title to `metadata.name`
- updates the window.location.hash wth the passed in hashParams. In this case of a local file there probably are no hashParams, but I haven't verified that.
- saves the content as `currentContent` and metadata as `metadata` in state

### `ProviderInterface#fileOpened`
- the `LocalFileProvider` doesn't define `fileOpened` so this parent definition is used
- the function doesn't do anything.

# Questions


