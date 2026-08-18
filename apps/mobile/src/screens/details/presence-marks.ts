export const MARK_MERGE_GAP = 3

export interface PresenceMark {
  identity: string
  position: number
}

type RawPresenceMap = Record<
  string,
  { identity?: unknown; position?: unknown } | null | undefined
>

export function derivePresenceMarks(
  presence: RawPresenceMap | null | undefined,
  selfIdentity: string,
): PresenceMark[] {
  if (!presence) return []

  const others: PresenceMark[] = []
  for (const [key, value] of Object.entries(presence)) {
    if (!value) continue
    const identity = typeof value.identity === 'string' ? value.identity : key
    if (identity === selfIdentity) continue
    const position = value.position
    if (typeof position !== 'number' || !Number.isFinite(position)) continue
    others.push({ identity, position: Math.min(100, Math.max(0, position)) })
  }
  others.sort((a, b) => a.position - b.position)

  const marks: PresenceMark[] = []
  let group: PresenceMark[] = []
  const flush = () => {
    if (group.length === 0) return
    marks.push({
      identity: group.map((m) => m.identity).sort()[0],
      position: group.reduce((sum, m) => sum + m.position, 0) / group.length,
    })
    group = []
  }
  for (const mark of others) {
    if (
      group.length > 0 &&
      mark.position - group[0].position > MARK_MERGE_GAP
    ) {
      flush()
    }
    group.push(mark)
  }
  flush()
  return marks
}
