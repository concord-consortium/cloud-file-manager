import { CloudFileManagerClient } from "../client"
import { ProviderInterface, CloudContent, CloudMetadata } from "./provider-interface"

type loadCallbackSig = (error: string|Error|null, content?: any, metadata?: CloudMetadata) => void
type shareCallbackSig = (error: string|Error|null, content?: any) => void

interface IPermissionSpec { _permissions: number }

export interface IShareProvider {
  client: CloudFileManagerClient
  provider: ProviderInterface
  loadSharedContent: (id: string, callback: loadCallbackSig) => void
  getSharingMetadata: (shared: boolean) => IPermissionSpec
  share: (
    shared: boolean,
    masterContent: CloudContent,
    sharedContent: CloudContent,
    metadata: CloudMetadata,
    callback: shareCallbackSig) => void
}
