import { beforeEach, describe, expect, it, vi } from 'vitest'

import { showToast } from './toast-store'

const showNativeToast = vi.hoisted(() => vi.fn())

vi.mock('@modules/yohaku', () => ({
  YohakuNative: { showToast: showNativeToast },
}))

describe('toast store', () => {
  beforeEach(() => {
    showNativeToast.mockClear()
  })

  it('forwards a message to native', () => {
    showToast('已复制链接')
    expect(showNativeToast).toHaveBeenCalledWith('已复制链接')
  })
})
