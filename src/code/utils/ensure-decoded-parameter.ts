const isEncoded = (value: string) => value !== decodeURIComponent(value)

export const ensureDecodedParameter = (value?: string) => {
  if (typeof value !== "undefined") {
    while (isEncoded(value)){
      value = decodeURIComponent(value)
    }
  }
  return value
}
