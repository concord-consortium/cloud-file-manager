// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import $ from 'jquery'
import pako from 'pako'
import { CloudFileManagerClient } from '../client'
import { CloudMetadata }  from './provider-interface'
import DocumentStoreProvider from './document-store-provider'
import DocumentStoreUrl, { DocumentStoreUrlParams } from './document-store-url'

//
// A utility class for providing sharing functionality via the Concord Document Store.
// Originally, sharing was wrapped into the Provider interface, but since we have no
// plans to extend sharing support to arbitrary providers like Google Drive, it seems
// cleaner to break out the sharing functionality into its own class.
//
class DocumentStoreShareProvider {
  client: CloudFileManagerClient
  docStoreUrl: DocumentStoreUrl
  provider: DocumentStoreProvider

  constructor(client: CloudFileManagerClient, provider: DocumentStoreProvider) {
    this.client = client
    this.provider = provider
    this.docStoreUrl = this.provider.docStoreUrl
  }

  loadSharedContent(id: string, callback: (err: string | null, content: any, sharedMetadata: CloudMetadata) => void) {
    const sharedMetadata = new CloudMetadata({
      sharedContentId: id,
      type: CloudMetadata.File,
      overwritable: false
    })
    return this.provider.load(sharedMetadata, (err: string | null, content: any) => callback(err, content, sharedMetadata))
  }

  getSharingMetadata(shared: boolean) {
    return { _permissions: shared ? 1 : 0 }
  }

  share(shared: boolean, masterContent: any, sharedContent: any, metadata: CloudMetadata, callback: (err: string | null, id?: string) => void) {

    // document ID is stored in masterContent
    let method, url
    const documentID = masterContent.get('sharedDocumentId')

    // newer V2 documents have 'accessKeys'; legacy V1 documents have 'sharedEditKey's
    // which are actually V1 'runKey's under an assumed name (to protect their identity?)
    const accessKeys = masterContent.get('accessKeys')
    const runKey = masterContent.get('shareEditKey')

    const accessKey = accessKeys?.readWrite || runKey

    const params: DocumentStoreUrlParams = {shared}
    if (accessKey) {
      params.accessKey = `RW::${accessKey}`
    }

    // if we already have a documentID and some form of accessKey,
    // then we must be updating an existing shared document
    if (documentID && accessKey) {
      ({method, url} = this.docStoreUrl.v2SaveDocument(documentID, params))
      return $.ajax({
        dataType: 'json',
        type: method,
        url,
        contentType: 'application/json', // Document Store requires JSON currently
        data: pako.deflate(sharedContent.getContentAsJSON()),
        processData: false,
        beforeSend(xhr) {
          return xhr.setRequestHeader('Content-Encoding', 'deflate')
        },
        context: this,
        xhrFields: {
          withCredentials: true
        },
        success(data) {
          // on successful share/save, capture the sharedDocumentId and shareEditKey
          if (runKey && (accessKeys == null)) {
            masterContent.addMetadata({
              accessKeys: { readWrite: runKey }})
          }
          return callback(null, data.id)
        },
        error(jqXHR) {
          const docName = metadata?.filename || 'document'
          return callback(`Unable to update shared '${docName}'`)
        }
      })

    // if we don't have a document ID and some form of accessKey,
    // then we must create a new shared document when sharing is being enabled
    } else if (shared) {
      params.shared = true;
      ({method, url} = this.docStoreUrl.v2CreateDocument(params))
      return $.ajax({
        dataType: 'json',
        type: method,
        url,
        contentType: 'application/json', // Document Store requires JSON currently
        data: pako.deflate(sharedContent.getContentAsJSON()),
        processData: false,
        beforeSend(xhr) {
          return xhr.setRequestHeader('Content-Encoding', 'deflate')
        },
        context: this,
        xhrFields: {
          withCredentials: true
        },
        success(data) {
          // on successful share/save, capture the sharedDocumentId and accessKeys
          masterContent.addMetadata({
            sharedDocumentId: data.id,
            accessKeys: { readOnly: data.readAccessKey, readWrite: data.readWriteAccessKey }})
          return callback(null, data.id)
        },
        error(jqXHR) {
          const docName = metadata?.filename || 'document'
          return callback(`Unable to share '${docName}'`)
        }
      })
    } else {
      const docName = metadata?.filename || 'document'
      return callback(`Unable to unshare '${docName}'`)
    }
  }
}

export default DocumentStoreShareProvider
