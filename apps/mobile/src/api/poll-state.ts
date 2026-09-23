import { camelize } from './camelize'
import type { ApiPollState } from './types'

export function parsePollState(raw: unknown): ApiPollState {
  const payload =
    raw && typeof raw === 'object' && 'data' in raw
      ? (raw as { data: unknown }).data
      : raw
  const tallies = (payload as { tallies?: Record<string, number> } | null)
    ?.tallies
  return { ...camelize<ApiPollState>(payload), tallies: tallies ?? {} }
}
