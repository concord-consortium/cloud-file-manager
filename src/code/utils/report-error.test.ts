import { reportError } from "./report-error"

describe('reportError', () => {
  const originalConsoleError = console.error

  afterEach(() => {
    console.error = originalConsoleError
  })

  it('should call console.error with a string message', () => {
    const mockConsoleError = jest.fn()
    console.error = mockConsoleError

    reportError("test error message")

    expect(mockConsoleError).toHaveBeenCalledTimes(1)
    expect(mockConsoleError).toHaveBeenCalledWith("test error message")
  })

  it('should call console.error with an Error object', () => {
    const mockConsoleError = jest.fn()
    console.error = mockConsoleError

    const error = new Error("test error")
    reportError(error)

    expect(mockConsoleError).toHaveBeenCalledTimes(1)
    expect(mockConsoleError).toHaveBeenCalledWith(error)
  })

  it('should handle console.error not being a function', () => {
    // Save original and set to undefined
    const saved = console.error
    ;(console as any).error = undefined

    // Should not throw
    expect(() => reportError("test")).not.toThrow()

    console.error = saved
  })
})
