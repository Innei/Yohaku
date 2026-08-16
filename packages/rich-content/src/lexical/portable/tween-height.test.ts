import { afterEach, describe, expect, it, vi } from 'vitest'

import { tweenHeight } from './tween-height'

describe('tweenHeight', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('animates from the collapsed height to the open height', async () => {
    const finish = new Set<EventListener>()
    const animate = vi.fn(() => ({
      addEventListener: (type: string, listener: EventListener) => {
        if (type === 'finish') finish.add(listener)
      },
    }))
    const el = {
      animate,
      style: { height: '', overflow: '' },
    } as unknown as HTMLElement

    const done = tweenHeight(el, 200, 800)
    expect(el.style.height).toBe('200px')
    expect(el.style.overflow).toBe('hidden')
    expect(animate).toHaveBeenCalledWith(
      [{ height: '200px' }, { height: '800px' }],
      { duration: 360, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    )
    finish.forEach((listener) => listener(new Event('finish')))
    await done
    expect(el.style.height).toBe('')
    expect(el.style.overflow).toBe('')
  })

  it('skips the tween when reduced motion is requested', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
    }))
    const el = {
      animate: vi.fn(),
      style: { height: '', overflow: '' },
    } as unknown as HTMLElement
    await tweenHeight(el, 200, 800)
    expect(el.animate).not.toHaveBeenCalled()
  })
})
