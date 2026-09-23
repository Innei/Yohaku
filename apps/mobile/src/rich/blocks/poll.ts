import type { ApiPollState } from '@/api/types'

export interface PollOption {
  id: string
  label: string
}

export interface PollRow {
  id: string
  label: string
  mine: boolean
  pct: number
}

function largestRemainderPercentages(
  counts: number[],
  total: number,
): number[] {
  if (total <= 0) return counts.map(() => 0)
  const raw = counts.map((count) => (count * 100) / total)
  const pcts = raw.map(Math.floor)
  let remainder = 100 - pcts.reduce((sum, pct) => sum + pct, 0)
  const order = raw
    .map((value, index) => ({ frac: value - Math.floor(value), index }))
    .sort((a, b) => b.frac - a.frac)
  for (const { index } of order) {
    if (remainder <= 0) break
    pcts[index] += 1
    remainder -= 1
  }
  return pcts
}

export function pollRows(
  options: PollOption[],
  state: ApiPollState,
  pickedLocal?: string[],
): PollRow[] {
  const tallies = state.tallies ?? {}
  const counts = options.map((option) => tallies[option.id] ?? 0)
  const pcts = largestRemainderPercentages(counts, state.totalVotes)
  const mine = new Set(state.userVote ?? pickedLocal ?? [])
  return options.map((option, index) => ({
    id: option.id,
    label: option.label,
    mine: mine.has(option.id),
    pct: pcts[index]!,
  }))
}

export function optimisticVote(
  state: ApiPollState,
  optionIds: string[],
): ApiPollState {
  const tallies = { ...state.tallies }
  for (const id of optionIds) tallies[id] = (tallies[id] ?? 0) + 1
  return {
    ...state,
    canVote: false,
    tallies,
    totalVotes: state.totalVotes + 1,
    userVote: optionIds,
  }
}
