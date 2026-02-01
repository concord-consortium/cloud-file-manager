import isArray from "./is-array"

describe('isArray', () => {
  it('should return true for arrays', () => {
    expect(isArray([])).toBe(true)
    expect(isArray([1, 2, 3])).toBe(true)
    expect(isArray(["a", "b", "c"])).toBe(true)
    expect(isArray([{ a: 1 }, { b: 2 }])).toBe(true)
  })

  it('should return true for Array constructor', () => {
    expect(isArray(new Array())).toBe(true)
    expect(isArray(new Array(3))).toBe(true)
    expect(isArray(Array.from("hello"))).toBe(true)
  })

  it('should return false for strings', () => {
    expect(isArray("hello")).toBe(false)
    expect(isArray("")).toBe(false)
  })

  it('should return false for numbers', () => {
    expect(isArray(123)).toBe(false)
    expect(isArray(0)).toBe(false)
  })

  it('should return false for objects', () => {
    expect(isArray({})).toBe(false)
    expect(isArray({ length: 3 })).toBe(false) // array-like but not an array
  })

  it('should return false for null and undefined', () => {
    expect(isArray(null)).toBe(false)
    expect(isArray(undefined)).toBe(false)
  })

  it('should return false for functions', () => {
    expect(isArray(() => [])).toBe(false)
  })

  it('should return false for arguments object', () => {
    function testArgs() {
      // eslint-disable-next-line prefer-rest-params
      expect(isArray(arguments)).toBe(false)
    }
    testArgs()
  })

  it('should work as a type guard', () => {
    const value: unknown = [1, 2, 3]
    expect(isArray(value)).toBe(true)
    // TypeScript should allow array methods after type guard
    const arr = value as unknown[]
    expect(arr.length).toBe(3)
    expect(arr[0]).toBe(1)
  })
})
