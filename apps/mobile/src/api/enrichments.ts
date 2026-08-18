import { camelize } from './camelize'
import type { ApiEnrichment } from './types'

export function camelizeEnrichments(
  raw: unknown,
): Record<string, ApiEnrichment> | null {
  if (!raw || typeof raw !== 'object') return null
  const entries = Object.entries(raw as Record<string, unknown>).map(
    ([url, entry]) => [url, camelize<ApiEnrichment>(entry)] as const,
  )
  if (entries.length === 0) return null
  return Object.fromEntries(entries)
}
