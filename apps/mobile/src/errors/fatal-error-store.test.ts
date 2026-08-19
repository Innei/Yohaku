import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  captureFatalError,
  clearFatalError,
  getFatalErrorSnapshot,
  subscribeFatalError,
} from './fatal-error-store'

describe('fatal error recovery store', () => {
  beforeEach(clearFatalError)

  it('publishes the first fatal error for the recovery screen', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeFatalError(listener)

    expect(captureFatalError(new Error('render failed'))).toBe(true)
    expect(getFatalErrorSnapshot()).toMatchObject({ message: 'render failed' })
    expect(listener).toHaveBeenCalledOnce()

    unsubscribe()
  })

  it('falls back instead of replacing an error already being recovered', () => {
    expect(captureFatalError(new Error('first'))).toBe(true)
    expect(captureFatalError(new Error('second'))).toBe(false)
    expect(getFatalErrorSnapshot()?.message).toBe('first')
  })

  it('clears the overlay before retrying the application tree', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeFatalError(listener)
    captureFatalError('failed')

    clearFatalError()

    expect(getFatalErrorSnapshot()).toBeNull()
    expect(listener).toHaveBeenCalledTimes(2)

    unsubscribe()
  })
})
