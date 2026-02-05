export default (value: unknown): value is unknown[] => Array.isArray(value)
