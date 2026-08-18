export function camelize<T>(value: unknown): T {
  return transform(value) as T
}

function transform(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(transform)
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, child]) => [
        key.replaceAll(/_([\da-z])/g, (_, char: string) => char.toUpperCase()),
        transform(child),
      ]),
    )
  }
  return value
}
