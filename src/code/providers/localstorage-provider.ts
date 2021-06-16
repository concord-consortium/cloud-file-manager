// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import tr from '../utils/translate'

import { ProviderInterface }  from './provider-interface'
import { cloudContentFactory }  from './provider-interface'
import { CloudMetadata }  from './provider-interface'

class LocalStorageProvider extends ProviderInterface {
  static Name = 'localStorage';
  client: any;
  options: any;

  constructor(options: any, client: any) {
    const opts = options || {}
    super({
      name: LocalStorageProvider.Name,
      // @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 1.
      displayName: opts.displayName || (tr('~PROVIDER.LOCAL_STORAGE')),
      urlDisplayName: opts.urlDisplayName,
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
    this.options = opts
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

  save(content: any, metadata: any, callback: any) {
    try {
      const fileKey = this._getKey(metadata.filename)
      window.localStorage.setItem(fileKey, ((typeof content.getContentAsJSON === 'function' ? content.getContentAsJSON() : undefined) || content))
      return (typeof callback === 'function' ? callback(null) : undefined)
    } catch (e) {
      return callback(`Unable to save: ${e.message}`)
    }
  }

  load(metadata: any, callback: any) {
    try {
      const content = window.localStorage.getItem(this._getKey(metadata.filename))
      return callback(null, cloudContentFactory.createEnvelopedCloudContent(content))
    } catch (e) {
      return callback(`Unable to load '${metadata.name}': ${e.message}`)
    }
  }

  list(metadata: any, callback: any) {
    const list = []
    const prefix = this._getKey(((metadata != null ? metadata.path() : undefined) || []).join('/'))
    for (let key of Object.keys(window.localStorage || {})) {
      if (key.substr(0, prefix.length) === prefix) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [filename, ...remainder] = key.substr(prefix.length).split('/')
        const name = key.substr(prefix.length)
        if (this.matchesExtension(name)) {
          list.push(new CloudMetadata({
            name,
            type: remainder.length > 0 ? (CloudMetadata as any).Folder : (CloudMetadata as any).File,
            parent: metadata,
            provider: this
          })
          )
        }
      }
    }
    return callback(null, list)
  }

  remove(metadata: any, callback: any) {
    try {
      window.localStorage.removeItem(this._getKey(metadata.filename))
      return (typeof callback === 'function' ? callback(null) : undefined)
    } catch (error) {
      return (typeof callback === 'function' ? callback('Unable to delete') : undefined)
    }
  }

  rename(metadata: any, newName: any, callback: any) {
    try {
      const content = window.localStorage.getItem(this._getKey(metadata.filename))
      // @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 1.
      window.localStorage.setItem(this._getKey(CloudMetadata.withExtension(newName)), content)
      window.localStorage.removeItem(this._getKey(metadata.filename))
      metadata.rename(newName)
      return callback(null, metadata)
    } catch (error) {
      return (typeof callback === 'function' ? callback('Unable to rename') : undefined)
    }
  }

  canOpenSaved() { return true }

  openSaved(openSavedParams: any, callback: any) {
    const metadata = new CloudMetadata({
      name: openSavedParams,
      type: (CloudMetadata as any).File,
      parent: null,
      provider: this
    })
    return this.load(metadata, (err: any, content: any) => callback(err, content, metadata))
  }

  getOpenSavedParams(metadata: any) {
    return metadata.name
  }

  _getKey(name: any) {
    if (name == null) { name = '' }
    return `cfm::${name.replace(/\t/g, ' ')}`
  }
}

LocalStorageProvider.Name='localStorage'
export default LocalStorageProvider
