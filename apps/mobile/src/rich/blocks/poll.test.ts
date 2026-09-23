import { describe, expect, it } from 'vitest'

import type { ApiPollState } from '@/api/types'

import { optimisticVote, pollRows } from './poll'

const options = [
  { id: 'o_1', label: 'A' },
  { id: 'o_2', label: 'B' },
  { id: 'o_3', label: 'C' },
]

function state(overrides: Partial<ApiPollState> = {}): ApiPollState {
  return {
    canVote: true,
    closed: false,
    status: 'ready',
    tallies: {},
    totalVotes: 0,
    ...overrides,
  }
}

describe('pollRows', () => {
  it('rounds percentages with largest-remainder so they sum to 100', () => {
    const rows = pollRows(
      options,
      state({ tallies: { o_1: 1, o_2: 1, o_3: 1 }, totalVotes: 3 }),
    )
    expect(rows.map((row) => row.pct)).toEqual([34, 33, 33])
    expect(rows.reduce((sum, row) => sum + row.pct, 0)).toBe(100)
  })

  it('matches the real /polls/:id tallies', () => {
    const rows = pollRows(
      options.map((o) => ({ ...o, id: o.id })),
      state({
        tallies: { o_1: 6, o_2: 6, o_3: 12 },
        totalVotes: 24,
      }),
    )
    expect(rows.map((row) => row.pct)).toEqual([25, 25, 50])
  })

  it('returns 0 for every option when nobody has voted', () => {
    const rows = pollRows(options, state({ totalVotes: 0 }))
    expect(rows.map((row) => row.pct)).toEqual([0, 0, 0])
  })

  it('marks the option in userVote as mine', () => {
    const rows = pollRows(
      options,
      state({ tallies: { o_2: 1 }, totalVotes: 1, userVote: ['o_2'] }),
    )
    expect(rows.map((row) => row.mine)).toEqual([false, true, false])
  })

  it('falls back to pickedLocal when there is no userVote yet', () => {
    const rows = pollRows(options, state(), ['o_1', 'o_3'])
    expect(rows.map((row) => row.mine)).toEqual([true, false, true])
  })
})

describe('optimisticVote', () => {
  it('bumps the picked tally, total votes, and locks further voting', () => {
    const next = optimisticVote(state({ tallies: { o_1: 2 }, totalVotes: 2 }), [
      'o_1',
    ])
    expect(next).toEqual(
      state({
        canVote: false,
        tallies: { o_1: 3 },
        totalVotes: 3,
        userVote: ['o_1'],
      }),
    )
  })

  it('bumps every picked option for a multi-choice vote', () => {
    const next = optimisticVote(state({ totalVotes: 0 }), ['o_1', 'o_2'])
    expect(next.tallies).toEqual({ o_1: 1, o_2: 1 })
    expect(next.totalVotes).toBe(1)
    expect(next.userVote).toEqual(['o_1', 'o_2'])
    expect(next.canVote).toBe(false)
  })
})
