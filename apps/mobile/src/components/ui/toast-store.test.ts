import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  dismissToast,
  getToast,
  showToast,
  TOAST_DISMISS_MS,
} from './toast-store'

describe('toast store', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    dismissToast()
  })

  afterEach(() => {
    dismissToast()
    vi.useRealTimers()
  })

  it('starts empty', () => {
    expect(getToast()).toBeNull()
  })

  it('shows a message', () => {
    showToast('已复制链接')
    expect(getToast()?.message).toBe('已复制链接')
  })

  it('replaces an existing toast and bumps the id', () => {
    showToast('first')
    const first = getToast()
    showToast('second')
    const second = getToast()
    expect(second?.message).toBe('second')
    expect(second?.id).not.toBe(first?.id)
  })

  it('dismisses the current toast', () => {
    showToast('已复制链接')
    dismissToast()
    expect(getToast()).toBeNull()
  })

  it('auto-dismisses after the dwell', () => {
    showToast('已复制链接')
    vi.advanceTimersByTime(TOAST_DISMISS_MS - 1)
    expect(getToast()?.message).toBe('已复制链接')
    vi.advanceTimersByTime(1)
    expect(getToast()).toBeNull()
  })

  it('resets the dwell when a new toast replaces the current one', () => {
    showToast('first')
    vi.advanceTimersByTime(TOAST_DISMISS_MS - 200)
    showToast('second')
    vi.advanceTimersByTime(TOAST_DISMISS_MS - 1)
    expect(getToast()?.message).toBe('second')
    vi.advanceTimersByTime(1)
    expect(getToast()).toBeNull()
  })
})
