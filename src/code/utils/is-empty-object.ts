import { isEmpty } from "lodash"

export const isEmptyObject = (o: any) => typeof o === "object" && isEmpty(o)
