import {
  PostMessageManager,
  PostMessageManagerImpl,
} from "@team-monolith/post-message-manager"
import { getCodapActivity, updateCodapActivity } from "../api/codapActivities"
import {
  getProfilesCodapActivityProject,
  updateProfilesCodapActivity,
} from "../api/profilesCodapActivities"
import { CFMBaseProviderOptions } from "../app-options"
import { CloudFileManagerClient } from "../client"

import {
  CloudContent,
  cloudContentFactory,
  CloudMetadata,
  ProviderInterface,
  ProviderListCallback,
  ProviderLoadCallback,
  ProviderOpenCallback,
  ProviderSaveCallback,
} from "./provider-interface"

class ClassRailsProvider extends ProviderInterface {
  static Name = "classRails"
  client: CloudFileManagerClient
  options: CFMBaseProviderOptions

  content: any
  files: Record<
    string,
    {
      content: CloudContent
      metadata: CloudMetadata
    }
  >
  private _postMessageManager: PostMessageManager
  private _activityName: string | undefined

  private _ready: Promise<void>
  private isReady: boolean = false

  constructor(
    options: CFMBaseProviderOptions | undefined,
    client: CloudFileManagerClient
  ) {
    super({
      name: ClassRailsProvider.Name,
      displayName: options?.displayName || "Class Rails Provider",
      urlDisplayName: options?.urlDisplayName,
      capabilities: {
        save: true,
        resave: true,
        "export": true,
        load: true,
        list: false,
        remove: false,
        rename: false,
        close: false,
      },
    })
    this.options = options
    this.client = client
    this.files = {}
    this._ready = this.initialize()
  }
  static Available() {
    return true
  }

  private async initialize(): Promise<void> {
    this._postMessageManager = new PostMessageManagerImpl()
    this._activityName = await this._loadActivityName()
    this.isReady = true // 초기화 완료
  }

  /**
   * 준비 상태를 확인하고, 준비가 되지 않았다면 준비가 될 때까지 대기합니다.
   */
  async ensureReady(): Promise<void> {
    if (!this.isReady) {
      await this._ready
    }
  }

  /**
   * 프로젝트 데이터를 서버에서 요청하여 가져옵니다.
   * 이때, is_edit_mode URL 파라미터에 따라 다른 API 엔드포인트를 사용합니다.
   */
  private async _getProjectData(projectId: string) {
    const urlParams = new URLSearchParams(window.location.search)
    const isEditMode = urlParams.has("is_edit_mode")
    if (isEditMode) {
      return (await getCodapActivity(projectId)).projectData
    } else {
      return await getProfilesCodapActivityProject(projectId)
    }
  }

  /**
   * 프로젝트 데이터를 서버에 업데이트합니다.
   * 이때, is_edit_mode URL 파라미터에 따라 다른 API 엔드포인트를 사용합니다.
   */
  private async _updateProjectData(projectData: unknown, projectId: string) {
    const urlParams = new URLSearchParams(window.location.search)
    const isEditMode = urlParams.has("is_edit_mode")
    if (isEditMode) {
      return await updateCodapActivity({ id: projectId, projectData })
    } else {
      return await updateProfilesCodapActivity({ id: projectId, projectData })
    }
  }

  /**
   * postMessage를 통해 부모 창으로부터 활동 이름을 가져옵니다.
   */
  private async _loadActivityName(): Promise<string | undefined> {
    try {
      const activityName = (await this._postMessageManager.send({
        messageType: "getActivityName",
        payload: null,
        target: window.parent,
        targetOrigin: "*",
      })) as string
      return activityName
    } catch {
      // timeout
      return undefined
    }
  }

  async save(
    content: any,
    metadata: CloudMetadata,
    callback?: ProviderSaveCallback
  ) {
    try {
      await this._updateProjectData(
        content.getContentAsJSON?.() || content,
        metadata.providerData.projectId
      )
      return callback?.(null)
    } catch (e) {
      return callback?.(`Unable to save: ${e.message}`)
    }
  }

  async load(metadata: CloudMetadata, callback: ProviderLoadCallback) {
    try {
      const projectData = await this._getProjectData(
        metadata.providerData.projectId
      )
      return callback(
        null,
        cloudContentFactory.createEnvelopedCloudContent(projectData)
      )
    } catch (e) {
      console.error(e)
      return callback(`Unable to load '${metadata.name}': ${e.message}`)
    }
  }

  list(_: CloudMetadata, callback: ProviderListCallback) {
    // 서버의 파일 목록을 가져오는 기능은 제공하지 않으므로, 빈 배열을 반환합니다.
    return callback(null, [])
  }

  canOpenSaved() {
    return true
  }

  canAuto() {
    return true
  }

  async openSaved(openSavedParams: any, callback: ProviderOpenCallback) {
    await this.ensureReady() // 준비 상태 확인
    const metadata = new CloudMetadata({
      name: this._activityName ?? "제목없음",
      type: CloudMetadata.File,
      parent: null,
      provider: this,
      providerData: { projectId: openSavedParams },
    })
    return this.load(metadata, (err: string | null, content: any) =>
      callback(err, content, metadata)
    )
  }

  getOpenSavedParams(metadata: CloudMetadata) {
    return metadata.providerData.projectId
  }
}

export default ClassRailsProvider
