import { describe, expect, it, vi } from 'vitest'

import {
  confirmAndFinishAppleTransaction,
  confirmAppleWithRetry,
} from './confirm-apple'

describe('confirmAppleWithRetry', () => {
  it('returns the first success', async () => {
    const confirm = vi.fn().mockResolvedValue({ status: 'active' })
    await expect(confirmAppleWithRetry(confirm, 'jws')).resolves.toEqual({
      status: 'active',
    })
    expect(confirm).toHaveBeenCalledTimes(1)
  })

  it('retries once after a failure', async () => {
    const confirm = vi
      .fn()
      .mockRejectedValueOnce(new Error('net'))
      .mockResolvedValue({ status: 'active' })
    await expect(confirmAppleWithRetry(confirm, 'jws')).resolves.toEqual({
      status: 'active',
    })
    expect(confirm).toHaveBeenCalledTimes(2)
  })

  it('throws when both attempts fail', async () => {
    const confirm = vi.fn().mockRejectedValue(new Error('net'))
    await expect(confirmAppleWithRetry(confirm, 'jws')).rejects.toThrow('net')
    expect(confirm).toHaveBeenCalledTimes(2)
  })
})

describe('confirmAndFinishAppleTransaction', () => {
  it('finishes the StoreKit transaction after backend confirmation', async () => {
    const events: string[] = []
    const confirm = vi.fn(async () => {
      events.push('confirm')
      return {
        currentPeriodEnd: '2026-09-01T00:00:00.000Z',
        plan: 'monthly' as const,
        status: 'active' as const,
      }
    })
    const finish = vi.fn(async () => {
      events.push('finish')
    })

    await expect(
      confirmAndFinishAppleTransaction(confirm, finish, 'compact-jws'),
    ).resolves.toEqual({
      currentPeriodEnd: '2026-09-01T00:00:00.000Z',
      plan: 'monthly',
      status: 'active',
    })

    expect(events).toEqual(['confirm', 'finish'])
    expect(confirm).toHaveBeenCalledWith('compact-jws')
    expect(finish).toHaveBeenCalledWith('compact-jws')
  })

  it('leaves the transaction unfinished when confirmation fails', async () => {
    const confirm = vi.fn().mockRejectedValue(new Error('offline'))
    const finish = vi.fn()

    await expect(
      confirmAndFinishAppleTransaction(confirm, finish, 'compact-jws'),
    ).rejects.toThrow('offline')
    expect(confirm).toHaveBeenCalledTimes(2)
    expect(finish).not.toHaveBeenCalled()
  })
})
