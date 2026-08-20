import { describe, expect, it } from 'vitest'

import { ApiError } from '@/api/errors'
import type { ApiNote } from '@/api/types'

import { resolveDatedNote } from './resolve-dated-note'

describe('resolveDatedNote', () => {
  it('resolves a valid note id', async () => {
    await expect(
      resolveDatedNote(async () => ({ data: { nid: 42 } as ApiNote })),
    ).resolves.toEqual({ kind: 'found', nid: 42 })
  })

  it('reports a definitive missing note for 404 and invalid payloads', async () => {
    await expect(
      resolveDatedNote(async () => {
        throw new ApiError(404, 'not found')
      }),
    ).resolves.toEqual({ kind: 'missing' })
    await expect(
      resolveDatedNote(async () => ({ data: { nid: 0 } as ApiNote })),
    ).resolves.toEqual({ kind: 'missing' })
  })

  it('keeps transient failures retryable', async () => {
    await expect(
      resolveDatedNote(async () => {
        throw new ApiError(503, 'unavailable')
      }),
    ).resolves.toEqual({ kind: 'retry' })
    await expect(
      resolveDatedNote(async () => {
        throw new Error('offline')
      }),
    ).resolves.toEqual({ kind: 'retry' })
  })
})
