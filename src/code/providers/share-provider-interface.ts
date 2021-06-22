import { CloudFileManagerClient } from "../client"
import { ProviderInterface, CloudContent, CloudMetadata } from "./provider-interface"

type loadCallbackSig = (error: string|Error, content: any) => void
type shareCallbackSig = (error: string|Error, content: any) => void

interface IPermissionSpec { _permissions: number }

export interface IShareProvider {
  client: CloudFileManagerClient
  provider: ProviderInterface
  loadSharedContent: (id:String, callback: loadCallbackSig) => void
  getSharingMetadata: (shared: boolean) => IPermissionSpec
  share: (
    shared: boolean,
    masterContent: CloudContent,
    sharedContent: CloudContent,
    metadata: CloudMetadata,
    callback: shareCallbackSig) => void
}
