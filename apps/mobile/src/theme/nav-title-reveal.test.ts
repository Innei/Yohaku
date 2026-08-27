import { describe, expect, it } from 'vitest'

import { navTitleReveal, navTitleTransition } from './nav-title-reveal'

describe('navTitleReveal', () => {
  it('uses the full fade clock at rest so the blur can match the title', () => {
    expect(navTitleReveal(0)).toEqual({
      bounce: 0,
      fadeMs: navTitleTransition.fadeDuration,
      riseDelayMs: navTitleTransition.riseDelay,
      riseMs: navTitleTransition.riseDuration,
    })
  })

  it('compresses fade and rise together when flung, same factor as the title', () => {
    const reveal = navTitleReveal(navTitleTransition.maxVelocity)
    expect(reveal.fadeMs).toBe(navTitleTransition.fadeDuration * 0.5)
    expect(reveal.riseMs).toBe(navTitleTransition.riseDuration * 0.5)
    expect(reveal.bounce).toBe(navTitleTransition.bounceFactor)
  })

  it('treats upward and downward flings the same', () => {
    expect(navTitleReveal(-800)).toEqual(navTitleReveal(800))
  })
})
