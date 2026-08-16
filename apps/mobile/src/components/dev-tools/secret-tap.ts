export const SECRET_TAP_COUNT = 5
export const SECRET_TAP_WINDOW_MS = 1500

export interface SecretTapState {
  at: number
  count: number
}

export const INITIAL_SECRET_TAP: SecretTapState = { at: 0, count: 0 }

export function nextSecretTap(
  prev: SecretTapState,
  now: number,
  options: { taps?: number; windowMs?: number } = {},
): SecretTapState & { unlocked: boolean } {
  const taps = options.taps ?? SECRET_TAP_COUNT
  const windowMs = options.windowMs ?? SECRET_TAP_WINDOW_MS
  const count = now - prev.at > windowMs ? 1 : prev.count + 1
  if (count >= taps) return { at: now, count: 0, unlocked: true }
  return { at: now, count, unlocked: false }
}
