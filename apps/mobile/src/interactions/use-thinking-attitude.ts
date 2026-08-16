import { eq, sql } from 'drizzle-orm'
import { useState } from 'react'

import { api } from '@/api/client'
import { db } from '@/db'
import { thinkings } from '@/db/schema'

import type { Attitude } from './attitude'
import { applyAttitude } from './attitude'
import { clearLiked, markLiked, useLikedKind } from './liked'

export function useThinkingAttitude(refId: string) {
  const likedKind = useLikedKind(refId)
  const current: Attitude | null =
    likedKind === 'recently-up'
      ? 'up'
      : likedKind === 'recently-down'
        ? 'down'
        : null
  const [pending, setPending] = useState(false)

  const send = async (pressed: Attitude) => {
    if (pending) return
    setPending(true)
    try {
      const { code } = await api.recentlyAttitude(
        refId,
        pressed === 'up' ? 0 : 1,
      )
      const { next, upDelta, downDelta } = applyAttitude(current, pressed, code)
      await db
        .update(thinkings)
        .set({
          up: sql`max(0, ${thinkings.up} + ${upDelta})`,
          down: sql`max(0, ${thinkings.down} + ${downDelta})`,
        })
        .where(eq(thinkings.id, refId))
      if (next === null) {
        await clearLiked(refId)
      } else {
        await markLiked(refId, next === 'up' ? 'recently-up' : 'recently-down')
      }
    } catch {
      // silent per spec: attitude failures roll nothing forward
    } finally {
      setPending(false)
    }
  }

  return { current, send, pending }
}
