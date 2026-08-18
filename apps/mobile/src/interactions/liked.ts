import { eq } from 'drizzle-orm'
import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { useMemo } from 'react'

import { db } from '@/db'
import type { LikedKind } from '@/db/schema'
import { likedRefs } from '@/db/schema'

export async function markLiked(refId: string, kind: LikedKind) {
  const likedAt = new Date()
  await db
    .insert(likedRefs)
    .values({ refId, kind, likedAt })
    .onConflictDoUpdate({ target: likedRefs.refId, set: { kind, likedAt } })
}

export async function clearLiked(refId: string) {
  await db.delete(likedRefs).where(eq(likedRefs.refId, refId))
}

export function useLikedKind(refId: string | undefined): LikedKind | null {
  const query = useMemo(
    () =>
      db
        .select()
        .from(likedRefs)
        .where(eq(likedRefs.refId, refId ?? ''))
        .limit(1),
    [refId],
  )
  const { data } = useLiveQuery(query, [refId])
  return data?.[0]?.kind ?? null
}
