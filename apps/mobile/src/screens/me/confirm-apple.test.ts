import { describe, expect, it, vi } from 'vitest'

import { confirmAppleWithRetry } from './confirm-apple'

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
