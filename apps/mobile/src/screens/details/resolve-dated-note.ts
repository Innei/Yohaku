import { ApiError } from '@/api/errors'
import type { ApiNote } from '@/api/types'

export async function resolveDatedNote(
  load: () => Promise<{ data: ApiNote }>,
): Promise<
  { kind: 'found'; nid: number } | { kind: 'missing' } | { kind: 'retry' }
> {
  try {
    const { data } = await load()
    if (!Number.isFinite(data.nid) || data.nid <= 0) return { kind: 'missing' }
    return { kind: 'found', nid: data.nid }
  } catch (error) {
    return error instanceof ApiError && error.status === 404
      ? { kind: 'missing' }
      : { kind: 'retry' }
  }
}
