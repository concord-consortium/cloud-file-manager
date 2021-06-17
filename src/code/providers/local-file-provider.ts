import tr  from '../utils/translate'
import {
  cloudContentFactory, CloudMetadata, IProviderInterfaceOpts, ProviderInterface,
  ProviderListCallback, ProviderLoadCallback, ProviderSaveCallback
}  from './provider-interface'
import localFileTabListView from '../views/local-file-tab-list-view'
import localFileTabSaveView from '../views/local-file-tab-save-view'

const LocalFileListTab = createReactFactory(localFileTabListView)
const LocalFileSaveTab = createReactFactory(localFileTabSaveView)

class LocalFileProvider extends ProviderInterface {
  public static Name = 'localFile'
  private options: IProviderInterfaceOpts;
  private client: any;
  constructor(options: IProviderInterfaceOpts, client: any) {
    super({
      name: LocalFileProvider.Name,
      // @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 1.
      displayName: options.displayName || (tr('~PROVIDER.LOCAL_FILE')),
      urlDisplayName: options.urlDisplayName || LocalFileProvider.Name,
      capabilities: {
        save: true,
        resave: false,
        "export": true,
        load: true,
        list: true,
        remove: false,
        rename: false,
        close: false
      }
    })
    this.options = options
    this.client = client
  }

  filterTabComponent(capability: string, defaultComponent: any) {
    if (capability === 'list') {
      return LocalFileListTab
    } else if ((capability === 'save') || (capability === 'export')) {
      return LocalFileSaveTab
    } else {
      return defaultComponent
    }
  }

  list(metadata: CloudMetadata, callback: ProviderListCallback) {}
    // not really implemented - we flag it as implemented so we show in the list dialog

  save(content: any, metadata: CloudMetadata, callback: ProviderSaveCallback) {
    // not really implemented - we flag it as implemented so we can add the download button to the save dialog
    return (typeof callback === 'function' ? callback(null) : undefined)
  }

  load(metadata: CloudMetadata, callback: ProviderLoadCallback) {
    const reader = new FileReader()
    reader.onload = loaded => {
      const content = cloudContentFactory.createEnvelopedCloudContent(loaded.target.result as string)
      return callback(null, content)
    }
    return reader.readAsText(metadata.providerData.file)
  }

  canOpenSaved() {
    // this prevents the hash to be updated
    return false
  }
}

export default LocalFileProvider
