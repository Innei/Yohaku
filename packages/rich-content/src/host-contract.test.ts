import { expect, it } from 'vitest'

import { HostFetchError } from './host'
import { assertFetchJSONContract } from './host-contract'

it('passes for an implementation that rejects with HostFetchError', async () => {
  const correctFetchJSON = async <T>(url: string): Promise<T> => {
    const res = await fetch(url)
    if (!res.ok) throw new HostFetchError(res.status, url)
    return res.json() as Promise<T>
  }
  await expect(
    assertFetchJSONContract(correctFetchJSON),
  ).resolves.toBeUndefined()
})

it('fails for an implementation that rejects with a bare Error', async () => {
  const wrongFetchJSON = async <T>(url: string): Promise<T> => {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`fetchJSON failed (${res.status}): ${url}`)
    return res.json() as Promise<T>
  }
  await expect(assertFetchJSONContract(wrongFetchJSON)).rejects.toThrow(
    /must reject with HostFetchError/,
  )
})

it('fails for an implementation that reports the wrong status', async () => {
  const wrongStatusFetchJSON = async <T>(url: string): Promise<T> => {
    const res = await fetch(url)
    if (!res.ok) throw new HostFetchError(res.status + 1, url)
    return res.json() as Promise<T>
  }
  await expect(assertFetchJSONContract(wrongStatusFetchJSON)).rejects.toThrow(
    /status must match/,
  )
})
