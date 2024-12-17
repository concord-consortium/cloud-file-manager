import { First } from "../utils/type"
import { Activitiable } from "./activitiable"

type Attributes = {
  id: string
  name: string
  materialId: string
  depth: "h1" | "h2" | "h3"
  tagIds: string[]
}

type Relationships = {
  activitiable: Activitiable
}

export type Activity<T extends string = ""> = Attributes &
  ActivityRelationships<T>

// Activitiable은 추가적인 Relationships를 가지고 있지 않으나
// 추후 추가될 수 있으므로 고려하여 코드 작성.
type ActivityRelationships<T extends string> = Omit<
  {
    [Key in T as First<Key>]: Key extends `activitiable.${string}`
      ? Activitiable
      : Key extends keyof Relationships
      ? Relationships[Key]
      : never
  },
  ""
>
