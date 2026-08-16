import { eq, sql } from 'drizzle-orm'
import { useState } from 'react'

import { api } from '@/api/client'
import { ApiError } from '@/api/errors'
import { db } from '@/db'
import { notes, posts } from '@/db/schema'

import { clearLiked, markLiked, useLikedKind } from './liked'

async function bumpLikeCount(kind: 'post' | 'note', refId: string) {
  const table = kind === 'post' ? posts : notes
  await db
    .update(table)
    .set({ likeCount: sql`${table.likeCount} + 1` })
    .where(eq(table.id, refId))
}

export function useLikeContent(
  kind: 'post' | 'note',
  refId: string | undefined,
) {
  const likedKind = useLikedKind(refId)
  const [pending, setPending] = useState(false)

  const like = async () => {
    if (!refId || likedKind !== null || pending) return
    setPending(true)
    await markLiked(refId, kind)
    try {
      await api.likeContent(kind, refId)
      await bumpLikeCount(kind, refId)
    } catch (error) {
      // A 400 here is the server's ALREADY_SUPPORTED dedupe (per-IP): the
      // like exists remotely, so the local liked mark must stay.
      if (!(error instanceof ApiError && error.status === 400)) {
        await clearLiked(refId)
      }
    } finally {
      setPending(false)
    }
  }

  return { liked: likedKind !== null, like, pending }
}
