// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS203: Remove `|| {}` from converted for-own loops
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import tr  from '../utils/translate'
import isString  from '../utils/is-string'
import isArray  from '../utils/is-array'

import { ProviderInterface }  from './provider-interface'
import { cloudContentFactory }  from './provider-interface'
import { CloudMetadata }  from './provider-interface'
import {reportError} from "../utils/report-error"

class ReadOnlyProvider extends ProviderInterface {
  Name: any;
  client: any;
  options: any;
  promises: any;
  tree: any;

  static initClass() {
    (this as any).Name = 'readOnly'
  }

  // @ts-expect-error ts-migrate(2376) FIXME: A 'super' call must be the first statement in the ... Remove this comment to see the full error message
  constructor(options: any, client: any) {
    const opts = options || {}
    super({
      name: (ReadOnlyProvider as any).Name,
      // @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 1.
      displayName: opts.displayName || (tr('~PROVIDER.READ_ONLY')),
      urlDisplayName: opts.urlDisplayName,
      capabilities: {
        save: false,
        resave: false,
        "export": false,
        load: true,
        list: true,
        remove: false,
        rename: false,
        close: false
      }
    })
    this.options = opts
    this.client = client
    this.tree = null
    this.promises = []
  }

  load(metadata: any, callback: any) {
    if (metadata && !isArray(metadata && (metadata.type === (CloudMetadata as any).File))) {
      if (metadata.content != null) {
        callback(null, metadata.content)

      } else if (metadata.url != null) {
        $.ajax({
          dataType: 'json',
          url: metadata.url,
          success(data) {
            return callback(null, cloudContentFactory.createEnvelopedCloudContent(data))
          },
          error() { return callback(`Unable to load '${metadata.name}'`) }
        })

      } else if ((metadata != null ? metadata.name : undefined) != null) {
        return this._loadTree((err: any, tree: any) => {
          if (err) { return callback(err) }
          const file = this._findFile(tree, metadata.name)
          if (file != null) {
            this.load(file, callback)          // call load again with found file, as it may be remote
          } else {
            callback(`Unable to load '${metadata.name}'`)
          }
        })
      }
    } else {
      return callback("Unable to load specified content")
    }
  }

  list(metadata: any, callback: any) {
    return this._loadTree((err: any, tree: any) => {
      if (err) { return callback(err) }
      const items = (metadata != null ? metadata.type : undefined) === (CloudMetadata as any).Folder ? metadata.providerData.children : this.tree
      // clone the metadata items so that any changes made to the filename or content in the edit is not cached
      return callback(null, _.map(items, metadataItem => new CloudMetadata(metadataItem)))
    })
  }

  canOpenSaved() { return true }

  openSaved(openSavedParams: any, callback: any) {
    const metadata = new CloudMetadata({
      name: unescape(openSavedParams),
      type: (CloudMetadata as any).File,
      parent: null,
      provider: this
    })
    return this.load(metadata, (err: any, content: any) => callback(err, content, metadata))
  }

  getOpenSavedParams(metadata: any) {
    return metadata.name
  }

  _loadTree = (callback: any) => {
    // wait for all promises to be resolved before proceeding
    const complete = (iTree: any) => {
      return Promise.all(this.promises)
        .then((function() {
          if (iTree != null) {
            return callback(null, iTree)
          } else {
            // an empty folder is unusual but not necessarily an error
            reportError(`No contents found for ${this.displayName} provider`)
            return callback(null, {})
          }
        }),
        // if a promise was rejected, then there was an error
        (function() { return callback(`No contents found for ${this.displayName} provider`) }))
    }

    if (this.tree !== null) {
      return complete(this.tree)
    } else if (this.options.json) {
      // @ts-expect-error ts-migrate(2554) FIXME: Expected 2-3 arguments, but got 1.
      this.tree = this._convertJSONToMetadataTree(this.options.json)
      return complete(this.tree)
    } else if (this.options.jsonCallback) {
      return this.options.jsonCallback((err: any, json: any) => {
        if (err) {
          return callback(err)
        } else {
          // @ts-expect-error ts-migrate(2554) FIXME: Expected 2-3 arguments, but got 1.
          this.tree = this._convertJSONToMetadataTree(this.options.json)
          return complete(this.tree)
        }
      })
    } else if (this.options.src) {
      const baseUrl = this.options.src.replace(/\/[^/]*$/, '/')
      return $.ajax({
        dataType: 'json',
        url: this.options.src,
        success: iResponse => {
          this.tree = this._convertJSONToMetadataTree(iResponse, baseUrl)
          // alphabetize remotely loaded folder contents if requested
          if (this.options.alphabetize) {
            this.tree.sort(function(iMeta1: any, iMeta2: any) {
              if (iMeta1.name < iMeta2.name) { return -1 }
              if (iMeta1.name > iMeta2.name) { return  1 }
              return  0
            })
          }
          return complete(this.tree)
        },
        error: (jqXHR, textStatus, errorThrown) => {
          const errorMetadata = this._createErrorMetadata(null)
          this.tree = [ errorMetadata ]
          return complete(this.tree)
        }
      })
    } else {
      return complete(null)
    }
  }

  // @ts-expect-error ts-migrate(7006) FIXME: Parameter 'parent' implicitly has an 'any' type.
  _convertJSONToMetadataTree(json: any, baseUrl: any, parent = null) {
    let metadata, type
    const tree = []

    if (isArray(json)) {
      // parse array format:
      // [{ name: "...", content: "..."}, { name: "...", type: 'folder', children: [...] }]
      for (let item of Array.from(json)) {
        type = CloudMetadata.mapTypeToCloudMetadataType((item as any).type)
        let url = (item as any).url || (item as any).location
        if (baseUrl && !(url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//'))) {
          url = baseUrl + url
        }
        metadata = new CloudMetadata({
          name: (item as any).name,
          type,
          description: (item as any).description,
          mimeType: (item as any).mimeType,
          content: ((item as any).content != null) ? cloudContentFactory.createEnvelopedCloudContent((item as any).content) : undefined,
          url,
          parent,
          provider: this,
          providerData: {
            children: null
          }
        })
        if (type === (CloudMetadata as any).Folder) {
          const newFolderPromise = (iItem: any, iMetadata: any) => {
            return new Promise((resolve, reject) => {
              if (iItem.children != null) {
                iMetadata.providerData.children = this._convertJSONToMetadataTree(iItem.children, baseUrl, iMetadata)
                return resolve(iMetadata)
              } else if (iItem.url != null) {
                return $.ajax({
                  dataType: 'json',
                  url: iItem.url,
                  success: iResponse => {
                    iMetadata.providerData.children = this._convertJSONToMetadataTree(iResponse, baseUrl, iMetadata)
                    // alphabetize remotely loaded folder contents if requested
                    if (this.options.alphabetize || iItem.alphabetize) {
                      iMetadata.providerData.children.sort(function(iMeta1: any, iMeta2: any) {
                        if (iMeta1.name < iMeta2.name) { return -1 }
                        if (iMeta1.name > iMeta2.name) { return  1 }
                        return  0
                      })
                    }
                    return resolve(iMetadata)
                  },
                  error: (jqXHR, textStatus, errorThrown) => {
                    const errorMetadata = this._createErrorMetadata(iMetadata)
                    iMetadata.providerData.children = [ errorMetadata ]
                    return resolve(iMetadata)
                  }
                })
              }
            })
          }
          this.promises.push(newFolderPromise(item, metadata))
        }

        tree.push(metadata)
      }
    } else {
      // parse original format:
      // { filename: "file contents", folderName: {... contents ...} }
      for (let filename of Object.keys(json || {})) {
        const itemContent = json[filename]
        type = isString(itemContent) ? (CloudMetadata as any).File : (CloudMetadata as any).Folder
        metadata = new CloudMetadata({
          name: filename,
          type,
          content: cloudContentFactory.createEnvelopedCloudContent(itemContent),
          parent,
          provider: this,
          providerData: {
            children: null
          }
        })
        if (type === (CloudMetadata as any).Folder) {
          metadata.providerData.children = this._convertJSONToMetadataTree(itemContent, baseUrl, metadata)
        }
        tree.push(metadata)
      }
    }

    return tree
  }

  // @ts-expect-error ts-migrate(7023) FIXME: '_findFile' implicitly has return type 'any' becau... Remove this comment to see the full error message
  _findFile(arr: any, filename: any) {
    for (let item of Array.from(arr)) {
      if ((item as any).type === (CloudMetadata as any).File) {
        if ((item != null ? (item as any).name : undefined) === filename) {
          return item
        }
      } else if (__guard__((item as any).providerData != null ? (item as any).providerData.children : undefined, (x: any) => x.length)) {
        // @ts-expect-error ts-migrate(7022) FIXME: 'foundChild' implicitly has type 'any' because it ... Remove this comment to see the full error message
        const foundChild = this._findFile((item as any).providerData.children, filename)
        if (foundChild != null) { return foundChild }
      }
    }
    return null
  }

  // Remote folder contents are likely to be loaded as part of
  // sample document hierarchies. The inability to load one subfolder
  // of examples shouldn't necessarily be treated as a fatal error.
  // Therefore, we put an item in the returned results which indicates
  // the error and which is non-selectable, but resolve the promise
  // so that the open can proceed without the missing folder contents.
  _createErrorMetadata(iParent: any) {
    return new CloudMetadata({
      // @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 1.
      name: tr("~FILE_DIALOG.LOAD_FOLDER_ERROR"),
      type: (CloudMetadata as any).Label,
      content: "",
      parent: iParent,
      provider: this,
      providerData: {
        children: null
      }
    })
  }
}
ReadOnlyProvider.initClass()

export default ReadOnlyProvider

function __guard__(value: any, transform: any) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined
}
