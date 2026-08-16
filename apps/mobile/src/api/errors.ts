export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly serverMessage?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function extractServerMessage(detail: string): string | undefined {
  try {
    const parsed = JSON.parse(detail) as { message?: unknown }
    if (typeof parsed.message === 'string') return parsed.message
    if (Array.isArray(parsed.message) && typeof parsed.message[0] === 'string')
      return parsed.message[0]
  } catch {
    return undefined
  }
  return undefined
}
