import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { dismissBanner, getBanner, showBanner } from './banner-store'

describe('banner store', () => {
  beforeEach(() => {
    dismissBanner()
  })

  afterEach(() => {
    dismissBanner()
  })

  it('starts empty', () => {
    expect(getBanner()).toBeNull()
  })

  it('shows a title and optional message', () => {
    showBanner({
      title: '同步失败',
      message: '内容可能不是最新',
    })
    expect(getBanner()?.title).toBe('同步失败')
    expect(getBanner()?.message).toBe('内容可能不是最新')
  })

  it('keeps an action until dismissed', () => {
    const onPress = () => {}
    showBanner({
      action: { onPress, title: '重试' },
      title: '同步失败',
    })
    expect(getBanner()?.action?.title).toBe('重试')
    expect(getBanner()?.action?.onPress).toBe(onPress)
  })

  it('replaces an existing banner and bumps the id', () => {
    showBanner({ title: 'first' })
    const first = getBanner()
    showBanner({ title: 'second' })
    const second = getBanner()
    expect(second?.title).toBe('second')
    expect(second?.id).not.toBe(first?.id)
  })

  it('dismisses the current banner and does not auto-dismiss', () => {
    showBanner({ title: '同步失败' })
    dismissBanner()
    expect(getBanner()).toBeNull()
  })
})
