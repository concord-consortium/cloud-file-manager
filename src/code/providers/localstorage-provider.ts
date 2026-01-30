// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { CFMBaseProviderOptions } from '../app-options'
import { CloudFileManagerClient } from '../client'
import tr from '../utils/translate'

import {
  cloudContentFactory, CloudMetadata, IListOptions, ProviderInterface, ProviderListCallback, ProviderLoadCallback,
  ProviderOpenCallback, ProviderRemoveCallback, ProviderRenameCallback, ProviderSaveCallback
}  from './provider-interface'

class LocalStorageProvider extends ProviderInterface {
  static Name = 'localStorage'
  client: CloudFileManagerClient
  options?: CFMBaseProviderOptions

  constructor(options: CFMBaseProviderOptions | undefined, client: CloudFileManagerClient) {
    super({
      name: LocalStorageProvider.Name,
      displayName: options?.displayName || (tr('~PROVIDER.LOCAL_STORAGE')),
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
  }
  static Available() {
    try {
      const test = 'LocalStorageProvider::auth'
      window.localStorage.setItem(test, test)
      window.localStorage.removeItem(test)
      return true
    } catch (error) {
      return false
    }
  }

  save(content: any, metadata: CloudMetadata, callback?: ProviderSaveCallback) {
    try {
      const fileKey = this._getKey(metadata.filename)
      window.localStorage.setItem(fileKey, content.getContentAsJSON?.() || content)
      return callback?.(null)
    } catch (e) {
      return callback?.(`Unable to save: ${e.message}`)
    }
  }

  load(metadata: CloudMetadata, callback: ProviderLoadCallback) {
    try {
      const content = window.localStorage.getItem(this._getKey(metadata.filename))
      return callback(null, cloudContentFactory.createEnvelopedCloudContent(content))
    } catch (e) {
      return callback(`Unable to load '${metadata.name}': ${e.message}`)
    }
  }

  list(metadata: CloudMetadata, callback: ProviderListCallback, options?: IListOptions) {
    const extension = options?.extension
    const readableExtensions = extension ? [extension] : CloudMetadata.ReadableExtensions

    const list = []
    const prefix = this._getKey((metadata?.path?.() || []).join('/'))
    for (let key of Object.keys(window.localStorage || {})) {
      if (key.substr(0, prefix.length) === prefix) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [filename, ...remainder] = key.substr(prefix.length).split('/')
        const name = key.substr(prefix.length)
        if (this.matchesExtension(name, readableExtensions)) {
          list.push(new CloudMetadata({
            name,
            type: remainder.length > 0 ? CloudMetadata.Folder : CloudMetadata.File,
            parent: metadata,
            provider: this
          })
          )
        }
      }
    }
    return callback(null, list)
  }

  remove(metadata: CloudMetadata, callback?: ProviderRemoveCallback) {
    try {
      window.localStorage.removeItem(this._getKey(metadata.filename))
      return callback?.('')
    } catch (error) {
      return callback?.('Unable to delete')
    }
  }

  rename(metadata: CloudMetadata, newName: string, callback?: ProviderRenameCallback) {
    try {
      const content = window.localStorage.getItem(this._getKey(metadata.filename)) ?? ''
      window.localStorage.setItem(this._getKey(CloudMetadata.withExtension(newName)), content)
      window.localStorage.removeItem(this._getKey(metadata.filename))
      metadata.rename(newName)
      return callback?.(null, metadata)
    } catch (error) {
      return callback?.('Unable to rename')
    }
  }

  canOpenSaved() { return true }

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

  _getKey(name: string | null = '') {
    return `cfm::${(name ?? '').replace(/\t/g, ' ')}`
  }
}

export default LocalStorageProvider
