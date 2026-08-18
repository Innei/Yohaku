import { describe, expect, it } from 'vitest'

import { INITIAL_SECRET_TAP, nextSecretTap } from './secret-tap'

describe('nextSecretTap', () => {
  it('unlocks on the fifth tap inside the window', () => {
    let state = INITIAL_SECRET_TAP
    for (let i = 1; i <= 4; i += 1) {
      state = nextSecretTap(state, i * 100)
      expect(state).toMatchObject({ count: i, unlocked: false })
    }
    expect(nextSecretTap(state, 500)).toEqual({
      at: 500,
      count: 0,
      unlocked: true,
    })
  })

  it('restarts after the window elapses', () => {
    const afterOne = nextSecretTap(INITIAL_SECRET_TAP, 0)
    const afterGap = nextSecretTap(afterOne, 1600)
    expect(afterGap).toMatchObject({ count: 1, unlocked: false })
  })

  it('counts from one again after unlock', () => {
    let state = INITIAL_SECRET_TAP
    for (let i = 1; i <= 5; i += 1) {
      state = nextSecretTap(state, i * 100)
    }
    expect(nextSecretTap(state, 600)).toMatchObject({
      count: 1,
      unlocked: false,
    })
  })
})
