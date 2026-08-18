import { splashTiming } from '@/theme/splash-timing'

export type SplashPhase =
  'intro' | 'holding' | 'breathing' | 'tearing' | 'fading' | 'done'

export interface SplashInput {
  appPainted: boolean
  elapsed: number
  failed: boolean
  ready: boolean
  reduceMotion: boolean
}

export interface SplashState {
  exitAt: number | null
  phase: SplashPhase
}

export type SplashEvent =
  { type: 'tick'; input: SplashInput } | { type: 'finished' }

export const initialSplashState: SplashState = { phase: 'intro', exitAt: null }

export function isSplashGateOpen(input: SplashInput): boolean {
  if (input.failed) return true
  if (input.elapsed >= splashTiming.ceiling) return true
  return input.ready && input.appPainted
}

export function reduceSplash(
  state: SplashState,
  event: SplashEvent,
): SplashState {
  if (event.type === 'finished') {
    return state.phase === 'done' ? state : { ...state, phase: 'done' }
  }
  if (state.phase === 'done' || state.exitAt !== null) return state

  const { input } = event
  const open = isSplashGateOpen(input)

  if (input.reduceMotion) {
    return open
      ? { phase: 'fading', exitAt: input.elapsed }
      : { phase: 'holding', exitAt: null }
  }

  if (open && input.elapsed >= splashTiming.tear.at) {
    return { phase: 'tearing', exitAt: input.elapsed }
  }
  if (input.elapsed >= splashTiming.breath.after) {
    return { phase: 'breathing', exitAt: null }
  }
  if (input.elapsed >= splashTiming.tear.at) {
    return { phase: 'holding', exitAt: null }
  }
  return { phase: 'intro', exitAt: null }
}
