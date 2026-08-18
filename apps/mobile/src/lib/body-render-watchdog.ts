export type WatchdogPhase =
  'waiting' | 'resending' | 'retrying' | 'reloading' | 'settled' | 'failed'

export type WatchdogAction = 'bump' | 'reload' | 'fail'

export const SKELETON_DELAY_MS = 250

/*
 * `$$props` reaches an adopted webview through a single unacknowledged
 * `injectJavaScript`, and a mount that races the native view's creation drops
 * it — the pooled page then keeps the previous mount's props forever. A cold
 * mount survives the same drop because its props are baked into the page load
 * as `initialProps`, so only the adopted path needs rescuing.
 *
 * `waiting` therefore has to expire before the skeleton appears (250ms) or a
 * lost injection is always visible as a skeleton flash; it also has to outlast
 * a healthy adoption, whose measured tail reaches 185ms over 24 pop→push
 * rounds, so the common path settles on its own instead of paying a spurious
 * resend.
 * `retrying` must outlast a cold webview boot (~3s): a pool-miss mount is
 * legitimately slow, and reloading it mid-boot would restart the boot loop.
 */
export const WATCHDOG_TIMEOUT_MS: Partial<Record<WatchdogPhase, number>> = {
  waiting: 200,
  resending: 600,
  retrying: 4000,
  reloading: 8000,
}

export function nextWatchdogPhase(
  phase: WatchdogPhase,
): { action: WatchdogAction; phase: WatchdogPhase } | null {
  switch (phase) {
    case 'waiting': {
      return { phase: 'resending', action: 'bump' }
    }
    case 'resending': {
      return { phase: 'retrying', action: 'bump' }
    }
    case 'retrying': {
      return { phase: 'reloading', action: 'reload' }
    }
    case 'reloading': {
      return { phase: 'failed', action: 'fail' }
    }
    default: {
      return null
    }
  }
}
