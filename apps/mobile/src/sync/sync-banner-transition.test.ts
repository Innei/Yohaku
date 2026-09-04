import { describe, expect, it } from 'vitest'

import { syncBannerTransition } from './sync-banner-transition'

describe('syncBannerTransition', () => {
  it('shows when entering error', () => {
    expect(syncBannerTransition('idle', 'error')).toBe('show')
    expect(syncBannerTransition('syncing', 'error')).toBe('show')
  })

  it('dismisses when leaving error', () => {
    expect(syncBannerTransition('error', 'idle')).toBe('dismiss')
    expect(syncBannerTransition('error', 'syncing')).toBe('dismiss')
  })

  it('stays put while error persists so a user dismiss is not revived', () => {
    expect(syncBannerTransition('error', 'error')).toBeNull()
  })

  it('ignores syncing that never fails', () => {
    expect(syncBannerTransition('idle', 'syncing')).toBeNull()
    expect(syncBannerTransition('syncing', 'idle')).toBeNull()
  })
})
