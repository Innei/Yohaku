import type {
  WithSpringConfig,
  WithTimingConfig,
} from 'react-native-reanimated'
import { Easing } from 'react-native-reanimated'

/*
 * Paper physics: nothing in this app visibly bounces. Presses settle
 * critically damped; sliding indicators glide with at most an
 * imperceptible overshoot; rolling text uses plain ease-out.
 */
export const springs = {
  settle: { duration: 240, dampingRatio: 1 } satisfies WithSpringConfig,
  glide: { duration: 280, dampingRatio: 0.95 } satisfies WithSpringConfig,
}

/*
 * Mirrors UIKit's large-title → bar-title handoff (reverse-engineered):
 * fade and rise run on separate spring clocks, both compressed by fling
 * speed, and only a hard fling earns visible bounce — the one sanctioned
 * exception to the no-bounce rule above, because it replicates the system.
 */
export const navTitleTransition = {
  maxVelocity: 2000,
  bounceFactor: 0.4,
  minDurationFactor: 0.5,
  fadeDuration: 450,
  riseDuration: 700,
  riseDelay: 60,
}

export const timings = {
  pressIn: { duration: 90 } satisfies WithTimingConfig,
  slot: {
    duration: 220,
    easing: Easing.out(Easing.cubic),
  } satisfies WithTimingConfig,
  fade: { duration: 150 } satisfies WithTimingConfig,
  emerge: { duration: 300 } satisfies WithTimingConfig,
  drift: {
    duration: 1400,
    easing: Easing.bezier(0.3, 0, 0.2, 1),
  } satisfies WithTimingConfig,
}

/*
 * Splash durations and geometry live in `splash-timing.ts` — the reducer that
 * consumes them has to stay importable from plain node under vitest, and
 * reanimated is not. Only the curves live here.
 */
export const splashEasing = {
  bleed: Easing.bezier(0.25, 0.7, 0.3, 1),
  seal: Easing.bezier(0.2, 0.7, 0.25, 1),
  tear: Easing.bezier(0.3, 0.55, 0.25, 1),
  breath: Easing.inOut(Easing.sin),
}
