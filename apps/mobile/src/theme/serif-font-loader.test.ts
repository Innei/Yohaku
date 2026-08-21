import { describe, expect, it, vi } from 'vitest'

import { createSerifFontLoader } from './serif-font-loader'

describe('serif-font-loader', () => {
  it('deduplicates concurrent AppleMyungjo downloads and notifies subscribers', async () => {
    let resolveDownload: ((installed: boolean) => void) | undefined
    const download = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          resolveDownload = resolve
        }),
    )
    const loader = createSerifFontLoader(download)
    const listener = vi.fn()
    loader.subscribe(listener)

    const first = loader.ensure()
    const second = loader.ensure()

    expect(first).toBe(second)
    expect(download).toHaveBeenCalledTimes(1)
    expect(loader.getSnapshot()).toBe('loading')

    resolveDownload?.(true)
    await first

    expect(loader.getSnapshot()).toBe('ready')
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('uses a stable failed state when the download is unavailable', async () => {
    const download = vi.fn().mockRejectedValue(new Error('offline'))
    const loader = createSerifFontLoader(download)

    await expect(loader.ensure()).resolves.toBe(false)

    expect(loader.getSnapshot()).toBe('failed')
    await expect(loader.ensure()).resolves.toBe(false)
    expect(download).toHaveBeenCalledTimes(1)
  })
})
