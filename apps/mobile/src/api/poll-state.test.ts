import { describe, expect, it } from 'vitest'

import { parsePollState } from './poll-state'

describe('parsePollState', () => {
  it('camelizes fields but keeps option-id tally keys verbatim', () => {
    const state = parsePollState({
      data: {
        can_vote: false,
        closed: true,
        status: 'ready',
        tallies: { o_0cehx0: 6, o_on69uo: 12 },
        total_votes: 18,
        user_vote: ['o_on69uo'],
      },
    })
    expect(state).toEqual({
      canVote: false,
      closed: true,
      status: 'ready',
      tallies: { o_0cehx0: 6, o_on69uo: 12 },
      totalVotes: 18,
      userVote: ['o_on69uo'],
    })
  })

  it('accepts an unwrapped payload', () => {
    const state = parsePollState({ tallies: { o_a1: 1 }, total_votes: 1 })
    expect(state.tallies).toEqual({ o_a1: 1 })
    expect(state.totalVotes).toBe(1)
  })
})
