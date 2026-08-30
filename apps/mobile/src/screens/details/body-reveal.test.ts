import { describe, expect, it } from 'vitest'

import {
  BODY_LOADING_DELAY_MS,
  BODY_REVEAL_INSTANT_MS,
  bodyRevealMotion,
} from './body-reveal'

describe('bodyRevealMotion', () => {
  it('snaps on before the instant threshold', () => {
    expect(bodyRevealMotion(0)).toBe('instant')
    expect(bodyRevealMotion(BODY_REVEAL_INSTANT_MS - 1)).toBe('instant')
  })

  it('fades from the instant threshold onward, including after the spinner delay', () => {
    expect(bodyRevealMotion(BODY_REVEAL_INSTANT_MS)).toBe('fade')
    expect(bodyRevealMotion(BODY_LOADING_DELAY_MS)).toBe('fade')
  })
})
