import { describe, expect, it } from 'vitest'

import { applyAttitude } from './attitude'

describe('applyAttitude', () => {
  it('records a fresh vote', () => {
    expect(applyAttitude(null, 'up', 1)).toEqual({
      next: 'up',
      upDelta: 1,
      downDelta: 0,
    })
  })

  it('switches sides in one round trip', () => {
    expect(applyAttitude('down', 'up', 1)).toEqual({
      next: 'up',
      upDelta: 1,
      downDelta: -1,
    })
  })

  it('toggles a vote off', () => {
    expect(applyAttitude('up', 'up', -1)).toEqual({
      next: null,
      upDelta: -1,
      downDelta: 0,
    })
    expect(applyAttitude('down', 'down', -1)).toEqual({
      next: null,
      upDelta: 0,
      downDelta: -1,
    })
  })
})
