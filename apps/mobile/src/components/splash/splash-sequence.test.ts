import { describe, expect, it } from 'vitest'

import { splashTiming } from '@/theme/splash-timing'

import type { SplashInput, SplashState } from './splash-sequence'
import { initialSplashState, reduceSplash } from './splash-sequence'

const { tear, breath, ceiling } = splashTiming

function tick(
  state: SplashState,
  input: Partial<SplashInput> & { elapsed: number },
) {
  return reduceSplash(state, {
    type: 'tick',
    input: {
      ready: false,
      failed: false,
      appPainted: false,
      reduceMotion: false,
      ...input,
    },
  })
}

function run(
  frames: (Partial<SplashInput> & { elapsed: number })[],
  from: SplashState = initialSplashState,
) {
  return frames.reduce(tick, from)
}

describe('reduceSplash', () => {
  it('stays in the intro beats while nothing is ready', () => {
    expect(run([{ elapsed: 0 }, { elapsed: 340 }, { elapsed: 500 }])).toEqual({
      phase: 'intro',
      exitAt: null,
    })
  })

  it('tears at exactly the tear mark when ready arrives early', () => {
    const state = run([
      { elapsed: 120, ready: true, appPainted: true },
      { elapsed: tear.at, ready: true, appPainted: true },
    ])
    expect(state).toEqual({ phase: 'tearing', exitAt: tear.at })
  })

  it('holds past the tear mark until the app has painted', () => {
    const state = run([{ elapsed: tear.at, ready: true, appPainted: false }])
    expect(state).toEqual({ phase: 'holding', exitAt: null })
  })

  it('tears immediately when ready lands between the tear mark and the breath mark', () => {
    const state = run([
      { elapsed: tear.at },
      { elapsed: 700, ready: true, appPainted: true },
    ])
    expect(state).toEqual({ phase: 'tearing', exitAt: 700 })
  })

  it('never enters the breath-hold when ready lands before the breath mark', () => {
    const frames = [
      { elapsed: tear.at },
      { elapsed: 700, ready: true, appPainted: true },
      { elapsed: breath.after, ready: true, appPainted: true },
    ]
    const phases = frames.reduce<string[]>((seen, frame, index) => {
      const state = run(frames.slice(0, index + 1))
      return [...seen, state.phase]
    }, [])
    expect(phases).not.toContain('breathing')
  })

  it('enters the breath-hold when ready is still missing at the breath mark', () => {
    const state = run([{ elapsed: tear.at }, { elapsed: breath.after }])
    expect(state).toEqual({ phase: 'breathing', exitAt: null })
  })

  it('resumes into the tear from the breath-hold', () => {
    const breathing = run([{ elapsed: breath.after }])
    expect(breathing.phase).toBe('breathing')

    const torn = tick(breathing, {
      elapsed: 2400,
      ready: true,
      appPainted: true,
    })
    expect(torn).toEqual({ phase: 'tearing', exitAt: 2400 })
  })

  it('tears at the ceiling even with nothing ready', () => {
    const state = run([{ elapsed: breath.after }, { elapsed: ceiling }])
    expect(state).toEqual({ phase: 'tearing', exitAt: ceiling })
  })

  it('tears immediately on migration failure, without waiting for paint', () => {
    const state = run([{ elapsed: tear.at, failed: true }])
    expect(state).toEqual({ phase: 'tearing', exitAt: tear.at })
  })

  it('holds before the tear mark even when failed', () => {
    const state = run([{ elapsed: 200, failed: true }])
    expect(state).toEqual({ phase: 'intro', exitAt: null })
  })

  describe('reduce motion', () => {
    const reduced = { reduceMotion: true } as const

    it('skips the tear mark floor and fades as soon as the gate opens', () => {
      const state = run([
        { elapsed: 40, ...reduced, ready: true, appPainted: true },
      ])
      expect(state).toEqual({ phase: 'fading', exitAt: 40 })
    })

    it('never enters the breath-hold', () => {
      const state = run([
        { elapsed: breath.after, ...reduced },
        { elapsed: 3000, ...reduced },
      ])
      expect(state).toEqual({ phase: 'holding', exitAt: null })
    })

    it('still honours the ceiling', () => {
      const state = run([{ elapsed: ceiling, ...reduced }])
      expect(state).toEqual({ phase: 'fading', exitAt: ceiling })
    })
  })

  describe('monotonicity', () => {
    it('cannot rewind out of the tear', () => {
      const torn = run([{ elapsed: tear.at, ready: true, appPainted: true }])
      const later = run(
        [
          { elapsed: tear.at + 10, ready: false, appPainted: false },
          { elapsed: tear.at + 20, ready: false, appPainted: false },
        ],
        torn,
      )
      expect(later).toEqual(torn)
    })

    it('cannot rewind out of the fade', () => {
      const faded = run([
        { elapsed: 40, reduceMotion: true, ready: true, appPainted: true },
      ])
      const later = tick(faded, { elapsed: 900, reduceMotion: true })
      expect(later).toEqual(faded)
    })

    it('ignores ticks once finished', () => {
      const torn = run([{ elapsed: tear.at, ready: true, appPainted: true }])
      const done = reduceSplash(torn, { type: 'finished' })
      expect(done.phase).toBe('done')
      expect(tick(done, { elapsed: 5000 })).toBe(done)
    })
  })
})
