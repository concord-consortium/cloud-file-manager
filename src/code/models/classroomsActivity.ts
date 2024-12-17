import { First } from "../utils/type"
import { Activity } from "./activity"

// 복잡한 타입 정의에 대한 설명은 src/models/README.md 참고

type Attributes = {
  id: string
  classroomsMaterialId: string
  activityId: string
}

type Relationships = {
  activity: Activity
}

export type ClassroomsActivity<T extends string = ""> = Attributes &
  ClassroomsActivityRelationships<T>

type ClassroomsActivityRelationships<T extends string> = Omit<
  {
    [Key in T as First<Key>]: Key extends `activity.${infer Last}`
      ? Activity<Last>
      : Key extends keyof Relationships
      ? Relationships[Key]
      : never
  },
  ""
>
