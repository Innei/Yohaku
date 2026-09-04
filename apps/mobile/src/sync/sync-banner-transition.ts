import type { SyncStatus } from './status'

export type SyncBannerCommand = 'dismiss' | 'show'

export function syncBannerTransition(
  previous: SyncStatus,
  next: SyncStatus,
): SyncBannerCommand | null {
  if (previous !== 'error' && next === 'error') return 'show'
  if (previous === 'error' && next !== 'error') return 'dismiss'
  return null
}
