import { isEmptyObject } from "./is-empty-object"

describe('isEmptyObject', () => {
  it('should return true for empty object literal', () => {
    expect(isEmptyObject({})).toBe(true)
  })

  it('should return true for Object.create(null)', () => {
    expect(isEmptyObject(Object.create(null))).toBe(true)
  })

  it('should return false for objects with properties', () => {
    expect(isEmptyObject({ a: 1 })).toBe(false)
    expect(isEmptyObject({ foo: "bar" })).toBe(false)
    expect(isEmptyObject({ nested: { prop: true } })).toBe(false)
  })

  it('should return false for objects with only undefined values', () => {
    expect(isEmptyObject({ a: undefined })).toBe(false)
  })

  it('should return true for empty arrays', () => {
    // Arrays are objects, and empty arrays are considered "empty" by lodash isEmpty
    expect(isEmptyObject([])).toBe(true)
  })

  it('should return false for non-empty arrays', () => {
    expect(isEmptyObject([1, 2, 3])).toBe(false)
    expect(isEmptyObject([""])).toBe(false)
  })

  it('should return false for primitives (except null)', () => {
    // Note: typeof null === "object" in JavaScript, so null is treated as an object
    expect(isEmptyObject(undefined)).toBe(false)
    expect(isEmptyObject("")).toBe(false)
    expect(isEmptyObject("hello")).toBe(false)
    expect(isEmptyObject(0)).toBe(false)
    expect(isEmptyObject(123)).toBe(false)
    expect(isEmptyObject(true)).toBe(false)
    expect(isEmptyObject(false)).toBe(false)
  })

  it('should return true for null (typeof null === "object")', () => {
    // This is a quirk of the implementation: typeof null === "object"
    // and lodash isEmpty(null) returns true
    expect(isEmptyObject(null)).toBe(true)
  })

  it('should return false for functions', () => {
    expect(isEmptyObject(() => {})).toBe(false)
  })

  it('should return true for Date objects (lodash considers them empty)', () => {
    // Date objects have no enumerable properties, so lodash isEmpty returns true
    expect(isEmptyObject(new Date())).toBe(true)
  })

  it('should return true for empty Map and Set', () => {
    // lodash isEmpty considers empty Map/Set as empty
    expect(isEmptyObject(new Map())).toBe(true)
    expect(isEmptyObject(new Set())).toBe(true)
  })

  it('should return false for non-empty Map and Set', () => {
    const map = new Map([["a", 1]])
    const set = new Set([1, 2, 3])
    expect(isEmptyObject(map)).toBe(false)
    expect(isEmptyObject(set)).toBe(false)
  })
})
