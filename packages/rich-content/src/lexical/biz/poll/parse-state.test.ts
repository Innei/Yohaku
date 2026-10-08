import { expect, it } from 'vitest'

import { parsePollState } from './parse-state'

it('unwraps the mx-core envelope and keeps option-id tally keys verbatim', () => {
  expect(
    parsePollState({
      data: {
        can_vote: false,
        closed: true,
        status: 'ready',
        tallies: { o_0cehx0: 6, o_on69uo: 12 },
        total_votes: 18,
        user_vote: ['o_on69uo'],
      },
    }),
  ).toEqual({
    canVote: false,
    closed: true,
    errorMessage: undefined,
    status: 'ready',
    tallies: { o_0cehx0: 6, o_on69uo: 12 },
    totalVotes: 18,
    userVote: ['o_on69uo'],
  })
})
