export interface ProfilesCodapActivity {
  id: string
  type: "profiles_codap_activity"
  projectData: unknown
  projectDataUpdatedAt: string | null // 한번도 저장하지 않은 경우 null
  lastStep: number
}
