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
import { ProviderInterface } from './provider-interface'
import getQueryParam from '../utils/get-query-param'

class PostMessageProvider extends ProviderInterface {
  Name: any;
  client: any;
  options: any;

  static initClass() {
    (this as any).Name = 'postMessage'
  }

  constructor(options: any, client: any) {
    const opts = options || {}

    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ capabilities: { save: false; r... Remove this comment to see the full error message
    super({
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
    this.options = opts
  }

  canOpenSaved() { return false }

  saveAsExport(content: any, metadata: any, callback: any) {
    window.parent.postMessage({
      action: "saveSecondaryFile",
      extension: metadata.extension,
      mimeType: metadata.mimeType,
      content
    }, "*")
    return (typeof callback === 'function' ? callback(null) : undefined)
  }
}
PostMessageProvider.initClass()

export default PostMessageProvider
