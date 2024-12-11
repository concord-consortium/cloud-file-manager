import { First } from "../utils/type"
import { ClassroomsActivity } from "./classroomsActivity"

// 복잡한 타입 정의에 대한 설명은 src/models/README.md 참고

type Attributes = {
  id: string
  isHidden: boolean
  createdAt: string
  updatedAt: string
  completedAt: string | null
  firstVisitedAt: string | null
  lastVisitedAt: string | null
  progress: number
  stayedTime: number
}

type Relationships = {
  classroomsActivity: ClassroomsActivity
}

export type ProfilesActivity<T extends string = ""> = Attributes &
  ProfilesActivityRelationships<T>

type ProfilesActivityRelationships<T extends string> = Omit<
  {
    [Key in T as First<Key>]: Key extends `classroomsActivity.${infer Last}`
      ? ClassroomsActivity<Last>
      : Key extends keyof Relationships
      ? Relationships[Key]
      : never
  },
  ""
>
