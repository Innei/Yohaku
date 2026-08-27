/*
 * Mirrors UIKit's large-title → bar-title handoff (reverse-engineered):
 * fade and rise run on separate spring clocks, both compressed by fling
 * speed, and only a hard fling earns visible bounce.
 */
export const navTitleTransition = {
  maxVelocity: 2000,
  bounceFactor: 0.4,
  minDurationFactor: 0.5,
  fadeDuration: 450,
  riseDuration: 700,
  riseDelay: 60,
}

export function navTitleReveal(velocity: number) {
  'worklet'
  const speed = Math.min(
    Math.abs(velocity) / navTitleTransition.maxVelocity,
    1,
  )
  const factor = 1 - (1 - navTitleTransition.minDurationFactor) * speed
  return {
    bounce: speed * navTitleTransition.bounceFactor,
    fadeMs: factor * navTitleTransition.fadeDuration,
    riseDelayMs: navTitleTransition.riseDelay,
    riseMs: factor * navTitleTransition.riseDuration,
  }
}
