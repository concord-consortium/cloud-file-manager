export type First<T extends string> = T extends `${infer U}.${string}` ? U : T
export type Last<T extends string> = T extends `${string}.${infer U}` ? U : T
export function expectNever(never: never): never {
  throw new Error("unreachable: " + never)
}

// activities.activitiable,activities.tags 과 같은 문자열을 취급하기 위한 유틸리티 타입입니다.
export type CommaToUnion<
  T extends string,
  Prefix extends string
> = T extends `${Prefix}.${infer a},${infer b}`
  ? a | CommaToUnion<b, Prefix>
  : T extends `${Prefix}.${infer a}`
  ? a
  : never
