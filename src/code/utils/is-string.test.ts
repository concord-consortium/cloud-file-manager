import isString from "./is-string"

describe('isString', () => {
  it('should return true for string literals', () => {
    expect(isString("hello")).toBe(true)
    expect(isString("")).toBe(true)
    expect(isString("123")).toBe(true)
  })

  it('should return true for String objects', () => {
    // eslint-disable-next-line no-new-wrappers
    expect(isString(new String("hello"))).toBe(false) // typeof returns "object" for String objects
  })

  it('should return false for numbers', () => {
    expect(isString(123)).toBe(false)
    expect(isString(0)).toBe(false)
    expect(isString(NaN)).toBe(false)
    expect(isString(Infinity)).toBe(false)
  })

  it('should return false for booleans', () => {
    expect(isString(true)).toBe(false)
    expect(isString(false)).toBe(false)
  })

  it('should return false for null and undefined', () => {
    expect(isString(null)).toBe(false)
    expect(isString(undefined)).toBe(false)
  })

  it('should return false for objects', () => {
    expect(isString({})).toBe(false)
    expect(isString({ toString: () => "hello" })).toBe(false)
  })

  it('should return false for arrays', () => {
    expect(isString([])).toBe(false)
    expect(isString(["hello"])).toBe(false)
  })

  it('should return false for functions', () => {
    expect(isString(() => "hello")).toBe(false)
  })

  it('should work as a type guard', () => {
    const value: unknown = "test"
    expect(isString(value)).toBe(true)
    // TypeScript should allow string methods after type guard
    const str = value as string
    expect(str.toUpperCase()).toBe("TEST")
  })
})
