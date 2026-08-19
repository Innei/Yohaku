import { useCallback, useEffect, useReducer, useState } from 'react'
import { AccessibilityInfo } from 'react-native'

import { splashTiming } from '@/theme/splash-timing'

import type { SplashPhase } from './splash-sequence'
import { initialSplashState, reduceSplash } from './splash-sequence'

export interface SplashSequence {
  begun: boolean
  finish: () => void
  phase: SplashPhase
  reduceMotion: boolean
}

export interface SplashGate {
  appPainted: boolean
  failed: boolean
  ready: boolean
  revealed: boolean
}

export function useSplashSequence({
  ready,
  failed,
  appPainted,
  revealed,
}: SplashGate): SplashSequence {
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [state, dispatch] = useReducer(reduceSplash, initialSplashState)

  useEffect(() => {
    let active = true
    const settle = (value: boolean) => {
      if (active) setReduceMotion(value)
    }
    void AccessibilityInfo.isReduceMotionEnabled().then(settle, () =>
      settle(false),
    )
    return () => {
      active = false
    }
  }, [])

  /*
   * The clock starts after RootLayout's explicit native-fade handoff delay.
   * Expo's hide promise reports dispatch, not the visual end of the fade, so it
   * cannot be used as the animation clock boundary.
   */
  useEffect(() => {
    if (startedAt !== null) return
    if (!revealed || reduceMotion === null) return
    setStartedAt(Date.now())
  }, [revealed, reduceMotion, startedAt])

  const tick = useCallback(() => {
    if (startedAt === null || reduceMotion === null) return
    dispatch({
      type: 'tick',
      input: {
        elapsed: Date.now() - startedAt,
        ready,
        failed,
        appPainted,
        reduceMotion,
      },
    })
  }, [startedAt, reduceMotion, ready, failed, appPainted])

  useEffect(() => {
    tick()
  }, [tick])

  useEffect(() => {
    if (startedAt === null) return
    const elapsed = Date.now() - startedAt
    const timers = [
      splashTiming.tear.at,
      splashTiming.breath.after,
      splashTiming.ceiling,
      splashTiming.reducedMinimum,
    ]
      .filter((mark) => mark > elapsed)
      .map((mark) => setTimeout(tick, mark - elapsed))
    return () => {
      for (const timer of timers) clearTimeout(timer)
    }
  }, [startedAt, tick])

  const finish = useCallback(() => dispatch({ type: 'finished' }), [])

  return {
    phase: state.phase,
    reduceMotion: reduceMotion ?? false,
    begun: startedAt !== null,
    finish,
  }
}
