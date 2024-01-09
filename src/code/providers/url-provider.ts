// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import $ from 'jquery'
import { CFMBaseProviderOptions } from '../app-options'
import { CloudFileManagerClient } from '../client'
import {
  cloudContentFactory, CloudMetadata, ICloudFileTypes, ProviderOpenCallback, ProviderInterface
}  from './provider-interface'

// This provider gets created by the client when needed to open a url directly.
// It cannot be added as one of the app's list of providers

class URLProvider extends ProviderInterface {
  public static Name = 'url-provider'
  client?: CloudFileManagerClient
  options?: CFMBaseProviderOptions

  constructor(options?: CFMBaseProviderOptions, client?: CloudFileManagerClient) {
    super({
      name: URLProvider.name,
      displayName: "URL Provider",
      urlDisplayName: options?.urlDisplayName || URLProvider.name,

      capabilities: {
        save: false,
        resave: false,
        "export": false,
        load: false,
        list: false,
        remove: false,
        rename: false,
        close: false
      }
    })
    this.options = options
    this.client = client
  }

  canOpenSaved() { return false }

  openFileFromUrl(url: string, callback: ProviderOpenCallback) {
    const metadata = new CloudMetadata({
      type: ICloudFileTypes.File,
      url,
      parent: null,
      provider: this
    })

    return $.ajax({
      url: metadata.url,
      success(data) {
        return callback(null, cloudContentFactory.createEnvelopedCloudContent(data), metadata)
      },
      error() { callback(`Unable to load document from '${metadata.url}'`) }
    })
  }
}

export default URLProvider
