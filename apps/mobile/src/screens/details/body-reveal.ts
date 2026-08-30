export const BODY_REVEAL_INSTANT_MS = 200
export const BODY_LOADING_DELAY_MS = 500

export function bodyRevealMotion(elapsedMs: number): 'fade' | 'instant' {
  return elapsedMs < BODY_REVEAL_INSTANT_MS ? 'instant' : 'fade'
}
