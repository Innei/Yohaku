import { expect, it, vi } from 'vitest'

import { __resetResourceCache, fetchResource } from './use-resource'

it('dedupes concurrent fetches for the same key', async () => {
  __resetResourceCache()
  const fetcher = vi.fn(async () => 'value')
  const [a, b] = await Promise.all([
    fetchResource('k', fetcher),
    fetchResource('k', fetcher),
  ])
  expect(a).toBe('value')
  expect(b).toBe('value')
  expect(fetcher).toHaveBeenCalledOnce()
})

it('serves a resolved key from cache without refetching', async () => {
  __resetResourceCache()
  const fetcher = vi.fn(async () => 'value')
  await fetchResource('k', fetcher)
  await fetchResource('k', fetcher)
  expect(fetcher).toHaveBeenCalledOnce()
})

it('does not cache a rejected fetch', async () => {
  __resetResourceCache()
  const fetcher = vi
    .fn()
    .mockRejectedValueOnce(new Error('boom 1'))
    .mockRejectedValueOnce(new Error('boom 2'))
    .mockRejectedValueOnce(new Error('boom 3'))
    .mockResolvedValueOnce('value')
  await expect(fetchResource('k', fetcher)).rejects.toThrow('boom 3')
  await expect(fetchResource('k', fetcher)).resolves.toBe('value')
  expect(fetcher).toHaveBeenCalledTimes(4)
})

it('retries a failing fetch up to 2 times before resolving', async () => {
  __resetResourceCache()
  const fetcher = vi
    .fn()
    .mockRejectedValueOnce(new Error('transient 1'))
    .mockRejectedValueOnce(new Error('transient 2'))
    .mockResolvedValueOnce('value')
  await expect(fetchResource('k', fetcher)).resolves.toBe('value')
  expect(fetcher).toHaveBeenCalledTimes(3)
})

it('settles into rejection after exhausting retries, without an infinite loop', async () => {
  __resetResourceCache()
  const fetcher = vi.fn().mockRejectedValue(new Error('always fails'))
  await expect(fetchResource('k', fetcher)).rejects.toThrow('always fails')
  expect(fetcher).toHaveBeenCalledTimes(3)
})
