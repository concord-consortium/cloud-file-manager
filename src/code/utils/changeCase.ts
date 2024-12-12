import { PascalCase, SnakeCase } from "type-fest"
import * as changeCase from "change-case"

/** string을 pascal case string으로 변환합니다. */
export function pascalCase<T extends string>(s: T): PascalCase<T> {
  return changeCase.pascalCase(s) as PascalCase<T>
}

/** string을 snake case string으로 변환합니다. */
export function snakeCase<T extends string>(s: T): SnakeCase<T> {
  return changeCase.snakeCase(s) as SnakeCase<T>
}
