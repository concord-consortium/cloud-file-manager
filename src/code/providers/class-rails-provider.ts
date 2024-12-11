import { getCodapActivity, updateCodapActivity } from "../api/codapActivities"
import {
  getProfilesCodapActivity,
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
  private _projectId: string | undefined = undefined

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
  }
  static Available() {
    return true
  }

  /**
   * 프로젝트 데이터를 서버에서 요청하여 가져옵니다.
   * 이때, is_edit_mode URL 파라미터에 따라 다른 API 엔드포인트를 사용합니다.
   */
  private async _getProjectData(projectId: string) {
    const urlParams = new URLSearchParams(window.location.search)
    const isEditMode = urlParams.has("is_edit_mode")
    if (isEditMode) {
      return (await getCodapActivity({ id: projectId })).projectData
    } else {
      const profilesCodapActivity = await getProfilesCodapActivity({
        id: projectId,
        includeProfilesActivity:
          "profilesActivity.classroomsActivity.activity.activitiable",
      })
      // profilesCodapActivity.projectData가 없다면 원본 activity의 projectData를 반환합니다.
      return (
        profilesCodapActivity.projectData ??
        profilesCodapActivity.profilesActivity.classroomsActivity.activity
          .activitiable.projectData
      )
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
   * 원본 활동의 이름을 가져옵니다.
   */
  private async _getActivityName(projectId: string) {
    const urlParams = new URLSearchParams(window.location.search)
    const isEditMode = urlParams.has("is_edit_mode")
    if (isEditMode) {
      const codapActivity = await getCodapActivity({
        id: projectId,
        includeActivity: "activity",
      })
      return codapActivity.activity.name
    } else {
      const profilesCodapActivity = await getProfilesCodapActivity({
        id: projectId,
        includeProfilesActivity: "profilesActivity.classroomsActivity.activity",
      })
      return profilesCodapActivity.profilesActivity.classroomsActivity.activity
        .name
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
      let activityName = ""
      try {
        activityName = await this._getActivityName(this._projectId)
      } catch {
        activityName = "제목없음"
      }

      const projectData = await this._getProjectData(this._projectId)
      // 프로젝트 데이터가 없다면 새로운 프로젝트를 열도록 합니다.
      // openNewCodapProject: true로 설정하여 새로운 프로젝트를 열도록 합니다.
      // 이 플래그를 핸들링하는 로직은 client.ts의 _fileOpened 함수에서 처리합니다.
      if (projectData === null) {
        metadata.rename(activityName)
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
      metadata.rename((projectData as any).name ?? activityName)
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
