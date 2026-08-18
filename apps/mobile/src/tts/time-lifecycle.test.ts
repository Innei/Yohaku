import { describe, expect, it, vi } from 'vitest'

import { createTtsTimeLifecycle } from './time-lifecycle'

describe('createTtsTimeLifecycle', () => {
  it('publishes live playback time while the app is active', () => {
    const publish = vi.fn()
    const lifecycle = createTtsTimeLifecycle({
      initiallyActive: true,
      publish,
    })

    lifecycle.handleTime({ duration: 120, elapsed: 12 })

    expect(publish).toHaveBeenCalledWith({ duration: 120, elapsed: 12 })
  })

  it('holds background playback time and publishes the latest value on resume', () => {
    const publish = vi.fn()
    const lifecycle = createTtsTimeLifecycle({
      initiallyActive: true,
      publish,
    })

    lifecycle.handleAppStateChange('background')
    lifecycle.handleTime({ duration: 120, elapsed: 30 })
    lifecycle.handleTime({ duration: 120, elapsed: 45 })
    expect(publish).not.toHaveBeenCalled()

    lifecycle.handleAppStateChange('active')
    expect(publish).toHaveBeenCalledOnce()
    expect(publish).toHaveBeenCalledWith({ duration: 120, elapsed: 45 })
  })

  it('restores a reset clock instead of stale background time', () => {
    const publish = vi.fn()
    const lifecycle = createTtsTimeLifecycle({
      initiallyActive: false,
      publish,
    })

    lifecycle.handleTime({ duration: 120, elapsed: 45 })
    lifecycle.reset()
    lifecycle.handleAppStateChange('active')

    expect(publish).toHaveBeenCalledOnce()
    expect(publish).toHaveBeenCalledWith({ duration: 0, elapsed: 0 })
  })
})
