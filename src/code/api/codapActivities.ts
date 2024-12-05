import { includeAndConvert } from "../lib/jsonapi"
import { CodapActivity } from "../models/activitiable"
import { fetchClassRails } from "./base"

export async function getCodapActivity(
  codapActivityId: string
): Promise<CodapActivity> {
  const response = await fetchClassRails(
    `/api/v1/codap_activities/${codapActivityId}`
  )
  const jsonResponse = await response.json()
  return includeAndConvert(jsonResponse.data, jsonResponse.included)
}

export async function updateCodapActivity(
  codapActivity: Pick<CodapActivity, "id" | "projectData">
): Promise<CodapActivity> {
  const response = await fetchClassRails(
    `/api/v1/codap_activities/${codapActivity.id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          type: "codap_activity",
          attributes: {
            project_data: codapActivity.projectData,
          },
        },
      }),
    }
  )
  const jsonResponse = await response.json()
  return includeAndConvert(jsonResponse.data, jsonResponse.included)
}
