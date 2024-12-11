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
  private _projectId: string | undefined = undefined

  private _ready: Promise<void>
  private isReady: boolean = false

  constructor(
    options: CFMBaseProviderOptions | undefined,
    client: CloudFileManagerClient
  ) {
    super({
      name: ClassRailsProvider.Name,
      displayName: options?.displayName || "서버",
      urlDisplayName: options?.urlDisplayName,
      capabilities: {
        save: true,
        resave: true,
        "export": false,
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
    this._ready = this._initialize()
  }
  static Available() {
    return true
  }

  private async _initialize(): Promise<void> {
    this._postMessageManager = new PostMessageManagerImpl()
    this._activityName = await this._loadActivityName()
    this.isReady = true // 초기화 완료
  }

  /**
   * 준비 상태를 확인하고, 준비가 되지 않았다면 준비가 될 때까지 대기합니다.
   */
  private async _ensureReady(): Promise<void> {
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

  /**
   * content 값을 저장할 때 호출되는 함수입니다.
   */
  async save(content: any, _: CloudMetadata, callback?: ProviderSaveCallback) {
    if (!this._projectId) {
      return callback?.("잘못된 접근입니다.")
    }
    try {
      await this._updateProjectData(
        content.getContentAsJSON?.() || content,
        this._projectId
      )
      return callback?.(null)
    } catch (e) {
      return callback?.(`파일을 저장 할 수 없습니다. ${e.message}`)
    }
  }

  /**
   * 파일을 불러올때 호출되는 함수입니다.
   */
  async load(metadata: CloudMetadata, callback: ProviderLoadCallback) {
    if (!this._projectId) {
      return callback?.("잘못된 접근입니다.")
    }
    try {
      const projectData = await this._getProjectData(this._projectId)

      // 프로젝트 데이터가 없다면 새로운 프로젝트를 열도록 합니다.
      // openNewCodapProject: true로 설정하여 새로운 프로젝트를 열도록 합니다.
      // 이 플래그를 핸들링하는 로직은 client.ts의 _fileOpened 함수에서 처리합니다.
      if (projectData === null) {
        metadata.rename(this._activityName ?? "제목없음")
        return callback(
          null,
          new CloudContent(
            { openNewCodapProject: true },
            { isCfmWrapped: false, isPreCfmFormat: false }
          )
        )
      }
      const content =
        cloudContentFactory.createEnvelopedCloudContent(projectData)
      metadata.rename(projectData.name ?? this._activityName ?? "제목없음")
      return callback(null, content)
    } catch (e) {
      console.error(e)
      return callback(`파일을 불러올 수 없습니다. ${e.message}`)
    }
  }

  list(_: CloudMetadata, callback: ProviderListCallback) {
    // 서버의 파일 목록을 가져오는 기능은 제공하지 않으므로, 빈 배열을 반환합니다.
    return callback(null, [])
  }

  canOpenSaved() {
    return true
  }

  /**
   * 저장된 프로젝트를 열때 호출되는 함수입니다.
   * 대표적인 use-case는 `#file=classRails:project_id` 형태의 URL을 통해 저장된 프로젝트를 열 때 사용됩니다.
   * 이때, `openSavedParams`는 project_id가 됩니다.
   */
  async openSaved(openSavedParams: string, callback: ProviderOpenCallback) {
    await this._ensureReady() // 준비 상태 확인
    this._projectId = openSavedParams
    const metadata = new CloudMetadata({
      type: CloudMetadata.File,
      parent: null,
      provider: this,
    })
    return this.load(metadata, (err: string | null, content: any) =>
      callback(err, content, metadata)
    )
  }

  getOpenSavedParams(_: CloudMetadata) {
    return this._projectId
  }
}

export default ClassRailsProvider
