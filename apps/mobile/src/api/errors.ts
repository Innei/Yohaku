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

export function formatApiErrorLine(error: unknown): string | undefined {
  if (error instanceof ApiError) {
    return error.serverMessage
      ? `HTTP ${error.status} ${error.serverMessage}`
      : error.message
  }
  if (error instanceof Error && error.message) return error.message
  return undefined
}

export function extractServerMessage(detail: string): string | undefined {
  try {
    const parsed = JSON.parse(detail) as {
      error?: { message?: unknown }
      message?: unknown
    }
    const nested = parsed.error?.message
    if (typeof nested === 'string') return nested
    if (typeof parsed.message === 'string') return parsed.message
    if (Array.isArray(parsed.message) && typeof parsed.message[0] === 'string')
      return parsed.message[0]
  } catch {
    return undefined
  }
  return undefined
}
