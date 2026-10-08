import type { PollState } from '@haklex/rich-compose/modules/poll'

interface RawPollState {
  can_vote?: boolean
  closed?: boolean
  error_message?: string
  status?: PollState['status']
  tallies?: Record<string, number>
  total_votes?: number
  user_vote?: string[]
}

export function parsePollState(raw: unknown): PollState {
  const payload = (
    raw && typeof raw === 'object' && 'data' in raw
      ? (raw as { data: unknown }).data
      : raw
  ) as RawPollState | null
  return {
    canVote: payload?.can_vote ?? false,
    closed: payload?.closed ?? false,
    errorMessage: payload?.error_message,
    status: payload?.status ?? 'error',
    tallies: payload?.tallies ?? {},
    totalVotes: payload?.total_votes ?? 0,
    userVote: payload?.user_vote,
  }
}
