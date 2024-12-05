import { includeAndConvert } from "../lib/jsonapi"
import { ProfilesCodapActivity } from "../models/profilesActivitiable"
import { fetchClassRails } from "./base"

/**
 * ProfilesCodapActivity의 project data를 가져옵니다.
 * 값이 null인 경우 원본 CodapActivity의 project data를 가져오는 로직이 BE에 구현되어 있습니다.
 * 이 API는 json api spec을 따르지 않고, project data를 직접 반환합니다.
 */
export async function getProfilesCodapActivityProject(
  profilesScratchActivityId: string
): Promise<any> {
  const response = await fetchClassRails(
    `/api/v1/profiles_codap_activities/${profilesScratchActivityId}/project`
  )
  return response.json()
}

export async function updateProfilesCodapActivity(
  profilesCodapActivity: Pick<ProfilesCodapActivity, "id" | "projectData">
): Promise<ProfilesCodapActivity> {
  const response = await fetchClassRails(
    `/api/v1/profiles_codap_activities/${profilesCodapActivity.id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          type: "profiles_codap_activity",
          attributes: {
            project_data: profilesCodapActivity.projectData,
          },
        },
      }),
    }
  )
  const jsonResponse = await response.json()
  return includeAndConvert(jsonResponse.data, jsonResponse.included)
}
