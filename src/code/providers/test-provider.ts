import { CFMBaseProviderOptions } from '../app-options'
import { CloudFileManagerClient } from '../client'

import {
  CloudContent,
  CloudMetadata, ProviderInterface, ProviderListCallback, ProviderLoadCallback,
  ProviderOpenCallback, ProviderRemoveCallback, ProviderRenameCallback, ProviderSaveCallback
}  from './provider-interface'

class TestProvider extends ProviderInterface {
  static Name = 'testProvider'
  client: CloudFileManagerClient
  options?: CFMBaseProviderOptions

  content: any
  files: Record<string, {content: CloudContent, metadata: CloudMetadata}>

  constructor(options: CFMBaseProviderOptions | undefined, client: CloudFileManagerClient) {
    super({
      name: TestProvider.Name,
      displayName: options?.displayName || "Test Provider",
      urlDisplayName: options?.urlDisplayName,
      capabilities: {
        save: true,
        resave: true,
        "export": true,
        load: true,
        list: true,
        remove: true,
        rename: true,
        close: false
      }
    })
    this.options = options
    this.client = client
    this.files = {}
  }
  static Available() {
    return true
  }

  save(content: any, metadata: CloudMetadata, callback?: ProviderSaveCallback) {
    const filename = metadata.filename ?? ''
    this.files[filename] = {content, metadata}
    return callback?.(null)
  }

  load(metadata: CloudMetadata, callback: ProviderLoadCallback) {
    const filename = metadata.filename ?? ''
    const file = this.files[filename]
    if (file) {
      return callback(null, file.content)
    }
    return callback(`Unable to load '${metadata.name}': file not previously saved`)
  }

  list(metadata: CloudMetadata, callback: ProviderListCallback) {
    return callback(null, Object.values(this.files).map(v => v.metadata))
  }

  remove(metadata: CloudMetadata, callback?: ProviderRemoveCallback) {
    const filename = metadata.filename ?? ''
    delete this.files[filename]
    return callback?.('')
  }

  rename(metadata: CloudMetadata, newName: string, callback?: ProviderRenameCallback) {
    const filename = metadata.filename ?? ''
    const temp = this.files[filename]
    delete this.files[filename]
    this.files[newName] = temp
    metadata.name = newName
    return callback?.(null, metadata)
  }

  canOpenSaved() { return true }

  canAuto() { return true }

  openSaved(openSavedParams: any, callback: ProviderOpenCallback) {
    const metadata = new CloudMetadata({
      name: openSavedParams,
      type: CloudMetadata.File,
      provider: this
    })
    return this.load(metadata, (err: string | null, content: any) => callback(err, content, metadata))
  }

  getOpenSavedParams(metadata: CloudMetadata) {
    return metadata.name
  }

  _getKey(name = '') {
    return `cfm::${name.replace(/\t/g, ' ')}`
  }
}

export default TestProvider
