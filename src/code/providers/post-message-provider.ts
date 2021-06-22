// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { CFMBaseProviderOptions } from '../app-options'
import { CloudFileManagerClient } from '../client'
import { CloudMetadata, ProviderInterface } from './provider-interface'
import getQueryParam from '../utils/get-query-param'

class PostMessageProvider extends ProviderInterface {
  static Name = 'postMessage'
  client: CloudFileManagerClient
  options: CFMBaseProviderOptions

  constructor(options: CFMBaseProviderOptions | undefined, client: CloudFileManagerClient) {
    super({
      name: PostMessageProvider.Name,
      capabilities: {
        save: false,
        resave: false,
        "export": getQueryParam("saveSecondaryFileViaPostMessage") ? 'auto' : false,
        load: false,
        list: false,
        remove: false,
        rename: false,
        close: false
      }
    })
    this.client = client
    this.options = options || {}
  }

  canOpenSaved() { return false }

  saveAsExport(content: any, metadata: CloudMetadata, callback?: (err: string | null) => void) {
    window.parent.postMessage({
      action: "saveSecondaryFile",
      extension: metadata.extension,
      mimeType: metadata.mimeType,
      content
    }, "*")
    callback?.(null)
  }
}

export default PostMessageProvider
