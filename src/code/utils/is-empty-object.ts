import { isEmpty } from "lodash"

export const isEmptyObject = (o: unknown): boolean => typeof o === "object" && isEmpty(o)
