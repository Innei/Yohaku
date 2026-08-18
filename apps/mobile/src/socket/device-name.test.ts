import { describe, expect, it } from 'vitest'

import { formatDeviceDisplayName } from './device-name-format'

describe('formatDeviceDisplayName', () => {
  it('pairs a marketing name with the hardware model id', () => {
    expect(
      formatDeviceDisplayName({
        modelId: 'iPhone17,1',
        modelName: 'iPhone 16 Pro',
      }),
    ).toBe('iPhone 16 Pro (iPhone17,1)')
  })

  it('uses the hardware id when the marketing name is only the family', () => {
    expect(
      formatDeviceDisplayName({
        modelId: 'iPhone17,1',
        modelName: 'iPhone',
      }),
    ).toBe('iPhone17,1')
  })

  it('falls back to whichever side is present', () => {
    expect(
      formatDeviceDisplayName({ modelId: 'iPhone17,1', modelName: null }),
    ).toBe('iPhone17,1')
    expect(
      formatDeviceDisplayName({ modelId: null, modelName: 'iPhone 16 Pro' }),
    ).toBe('iPhone 16 Pro')
    expect(formatDeviceDisplayName({ modelId: null, modelName: null })).toBe(
      'iPhone',
    )
  })
})
