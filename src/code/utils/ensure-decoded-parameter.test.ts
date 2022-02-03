import { ensureDecodedParameter } from "./ensure-decoded-parameter"

describe("ensureDecodedParameter", () => {
  it("handles undefined strings", () => {
    expect(ensureDecodedParameter()).toBeUndefined()
  })

  it("handles empty strings", () => {
    expect(ensureDecodedParameter("")).toBe("")
  })

  it("handles non-encoded strings", () => {
    expect(ensureDecodedParameter("foo")).toBe("foo")
  })

  it("handles single-encoded strings", () => {
    expect(ensureDecodedParameter("this%20is%20a%20test")).toBe("this is a test")
  })

  it("handles double-encoded strings", () => {
    expect(ensureDecodedParameter("this%2520is%2520a%2520test")).toBe("this is a test")
  })

  it("handles many, many encoded strings", () => {
    for (let i = 3; i < 10; i++) {
      const unencoded = "this is a test"
      let encoded = unencoded
      for (let j = 0; j < i; j++) {
        encoded = encodeURIComponent(encoded)
      }
      expect(encoded).not.toEqual(unencoded)
      expect(ensureDecodedParameter(encoded)).toBe(unencoded)
    }
  })
})