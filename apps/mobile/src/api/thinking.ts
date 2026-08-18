import { camelize } from './camelize'
import { camelizeEnrichments } from './enrichments'
import type { ApiThinking } from './types'

export function parseThinkingList(raw: unknown): ApiThinking[] {
  const envelope = raw as { data?: unknown }
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(envelope?.data)
      ? envelope.data
      : []
  return list.map(parseThinkingItem)
}

function parseThinkingItem(raw: unknown): ApiThinking {
  const item = (raw ?? {}) as Record<string, unknown>
  const { enrichments: rawEnrichments, ...rest } = item
  return {
    ...camelize<Omit<ApiThinking, 'enrichments'>>(rest),
    enrichments: camelizeEnrichments(rawEnrichments),
  }
}
