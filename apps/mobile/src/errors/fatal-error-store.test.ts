import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  captureFatalError,
  clearFatalError,
  getFatalErrorSnapshot,
  registerFatalErrorHost,
  subscribeFatalError,
} from './fatal-error-store'

describe('fatal error recovery store', () => {
  beforeEach(clearFatalError)

  it('forwards fatal errors until the recovery host is mounted', () => {
    expect(captureFatalError(new Error('startup failed'))).toBe(false)
    expect(getFatalErrorSnapshot()).toBeNull()
  })

  it('publishes the first fatal error for the recovery screen', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeFatalError(listener)
    const unregisterHost = registerFatalErrorHost()

    expect(captureFatalError(new Error('render failed'))).toBe(true)
    expect(getFatalErrorSnapshot()).toMatchObject({ message: 'render failed' })
    expect(listener).toHaveBeenCalledOnce()

    unregisterHost()
    unsubscribe()
  })

  it('falls back instead of replacing an error already being recovered', () => {
    const unregisterHost = registerFatalErrorHost()

    expect(captureFatalError(new Error('first'))).toBe(true)
    expect(captureFatalError(new Error('second'))).toBe(false)
    expect(getFatalErrorSnapshot()?.message).toBe('first')

    unregisterHost()
  })

  it('clears the overlay before retrying the application tree', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeFatalError(listener)
    const unregisterHost = registerFatalErrorHost()
    captureFatalError('failed')

    clearFatalError()

    expect(getFatalErrorSnapshot()).toBeNull()
    expect(listener).toHaveBeenCalledTimes(2)

    unregisterHost()
    unsubscribe()
  })

  it('forwards fatal errors again after the recovery host unmounts', () => {
    const unregisterHost = registerFatalErrorHost()
    unregisterHost()

    expect(captureFatalError(new Error('after unmount'))).toBe(false)
    expect(getFatalErrorSnapshot()).toBeNull()
  })
})
