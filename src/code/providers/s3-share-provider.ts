import {
  ProviderShareCallback,
  ProviderLoadCallback,
  ProviderInterface,
  ICloudFileTypes,
  CloudContent,
  CloudMetadata
}  from './provider-interface'
import { CloudFileManagerClient } from '../client'
import { IShareProvider} from './share-provider-interface'
import { createFile, updateFile, deleteFile } from '../utils/s3-share-provider-token-service-helper'
import { reportError } from '../utils/report-error'
import { sha256 } from 'js-sha256'

// New method for sharing read only documents using S3.
// The readWrite key must be retained in the original document
// so that the shared document can be updated.
// Based on the historical `document-store-share-provider`
class S3ShareProvider implements IShareProvider  {
  public static Name ='s3-share-provider'
  client: CloudFileManagerClient
  provider: ProviderInterface

  constructor(client:CloudFileManagerClient, _provider: ProviderInterface) {
    this.provider = _provider
    this.client = client
  }

  loadSharedContent(id: string, callback: ProviderLoadCallback) {
    const sharedMetadata = new CloudMetadata({
      sharedContentId: id,
      type: ICloudFileTypes.File,
      overwritable: false
    })
    this.provider.load(sharedMetadata, (err, content) => callback(err, content, sharedMetadata))
  }

  getSharingMetadata(shared: boolean) {
    return { _permissions: shared ? 1 : 0 }
  }

  private updateShare(
    contentJSON: string,
    documentID: string,
    readWriteToken: string,
    callback: ProviderShareCallback) {
      // Call update:
      updateFile({
        newFileContent: contentJSON,
        // DocumentID is the resourceID for TokenService
        resourceId: documentID,
        readWriteToken: readWriteToken

      }).then(() => {
        callback(null, documentID)
      }).catch(e => { // eslint-disable-line @typescript-eslint/dot-notation
        reportError(e)
        return callback(`Unable to update shared file ${e}`)
      })
  }

  private deleteShare(documentID: string, readWriteToken: string, callback: ProviderShareCallback) {
    deleteFile({
      // DocumentID is the resourceID for TokenService
      resourceId: documentID,
      readWriteToken: readWriteToken
    }).then(() => {
      callback(null, documentID)
    }).catch((e: Error) => {  // eslint-disable-line @typescript-eslint/dot-notation
      reportError(e)
      return callback(`Unable to delete shared file ${e}`)
    })
  }

  private createShare(
    masterContent: CloudContent,
    contentJSON: string,
    metadata: CloudMetadata,
    callback: ProviderShareCallback,
    ) {
    const result = createFile({
      fileContent: contentJSON
    })
    result.then( ({publicUrl, resourceId, readWriteToken}) => {
      metadata.sharedContentSecretKey=readWriteToken
      metadata.url=publicUrl
      // on successful share/save, capture the sharedDocumentId and accessKeys
      masterContent.addMetadata({
        // DocumentId is the same as TokenService resourceId
        sharedDocumentId: resourceId,
        sharedDocumentUrl: publicUrl,
        accessKeys: { readOnly: publicUrl, readWrite: readWriteToken }
      })
      return callback(null, readWriteToken)
    }).catch( e => {  // eslint-disable-line @typescript-eslint/dot-notation
      return callback(`Unable to share file ${e}`)
    })
  }

  // Public interface called by client:
  share(
    shared: boolean,
    masterContent: CloudContent,
    sharedContent: CloudContent,
    metadata: CloudMetadata,
    callback: ProviderShareCallback) {

    // document ID is stored in masterContent
    let documentID = masterContent.get('sharedDocumentId')

    // newer V2 documents have 'accessKeys'; legacy V1 documents have 'sharedEditKey's
    // which are actually V1 'runKey's under an assumed name (to protect their identity?)
    const accessKeys = masterContent.get('accessKeys')
    const runKey = masterContent.get('shareEditKey')
    let readWriteToken = accessKeys?.readWrite || runKey
    const contentJson = sharedContent.getContentAsJSON()
    // if we already have a documentID and some form of accessKey,
    // then we must be updating an existing shared document
    if (documentID && readWriteToken) {
      // There are two kinds of documents we might encounter:
      // 1. Documents shared using old CFM based on document-store.
      // 2. Documents shared using new, token-service based CFM.
      // There are a few ways to recognize legacy documents that require special handling:
      // - readWriteToken key doesn't start with "read-write-token" prefix
      // - documentID is a number (new docs have Firestore IDs which are combinations of digits and characters)
      // - there is no "sharedDocumentUrl"
      // Any of these methods can be used to detect legacy document.
      const isLegacyDocument = readWriteToken.indexOf("read-write-token") !== 0
      if (isLegacyDocument) {
        // This logic is based on logic in the document store migration script:
        // https://github.com/concord-consortium/document-store/blob/master/token-service-migration/index.js#L115-L126
        documentID = accessKeys.readOnly
        if (!documentID) {
          // document-store migration does the same thing if readOnly key is missing.
          documentID = sha256(readWriteToken)
        }
        // Again, follow document-store migration code.
        readWriteToken = "read-write-token:doc-store-imported:" + readWriteToken
      }
      if (shared) {
        this.updateShare(contentJson, documentID, readWriteToken, callback)
      } else {
        this.deleteShare(documentID, readWriteToken, callback)
      }
      // if we don't have a document ID and some form of accessKey,
      // then we must create a new shared document when sharing is being enabled
    } else if (shared) {
      this.createShare(masterContent, contentJson, metadata, callback)
    } else {
      return callback(`Unable to stop sharing the file - no access key`)
    }
  }

}

export default S3ShareProvider
