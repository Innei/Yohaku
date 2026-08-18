import type { LikedKind } from '@/db/schema'

export function likedActivityCount(rows: { kind: LikedKind }[]): number {
  return rows.filter((row) => row.kind !== 'recently-down').length
}
