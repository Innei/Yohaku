import { describe, expect, it } from 'vitest'

import {
  nextWatchdogPhase,
  SKELETON_DELAY_MS,
  WATCHDOG_TIMEOUT_MS,
} from './body-render-watchdog'

describe('nextWatchdogPhase', () => {
  it('escalates waiting → resending → retrying → reloading → failed', () => {
    expect(nextWatchdogPhase('waiting')).toEqual({
      phase: 'resending',
      action: 'bump',
    })
    expect(nextWatchdogPhase('resending')).toEqual({
      phase: 'retrying',
      action: 'bump',
    })
    expect(nextWatchdogPhase('retrying')).toEqual({
      phase: 'reloading',
      action: 'reload',
    })
    expect(nextWatchdogPhase('reloading')).toEqual({
      phase: 'failed',
      action: 'fail',
    })
  })

  it('stops at terminal phases', () => {
    expect(nextWatchdogPhase('settled')).toBeNull()
    expect(nextWatchdogPhase('failed')).toBeNull()
  })

  it('gives a cold boot more time than an adopted mount', () => {
    expect(WATCHDOG_TIMEOUT_MS.retrying!).toBeGreaterThan(3000)
    expect(WATCHDOG_TIMEOUT_MS.waiting!).toBeLessThan(1000)
  })

  it('resends a lost injection before the skeleton becomes visible', () => {
    expect(WATCHDOG_TIMEOUT_MS.waiting!).toBeLessThan(SKELETON_DELAY_MS)
  })

  it('lets a healthy adoption settle before resending', () => {
    expect(WATCHDOG_TIMEOUT_MS.waiting!).toBeGreaterThan(185)
  })

  it('has a timeout for every non-terminal phase', () => {
    for (const phase of [
      'waiting',
      'resending',
      'retrying',
      'reloading',
    ] as const) {
      expect(WATCHDOG_TIMEOUT_MS[phase]).toBeGreaterThan(0)
    }
  })
})
