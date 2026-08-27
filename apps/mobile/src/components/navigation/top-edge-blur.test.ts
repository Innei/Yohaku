import { describe, expect, it } from 'vitest'

import { topBlurOverlayHeight } from './top-edge-blur'

describe('topBlurOverlayHeight', () => {
  it('extends the top edge effect 44pt beyond a regular header', () => {
    expect(topBlurOverlayHeight(116)).toBe(160)
  })

  it('keeps the edge effect extension when the header is not measured yet', () => {
    expect(topBlurOverlayHeight(0)).toBe(44)
    expect(topBlurOverlayHeight(-4)).toBe(44)
  })
})
