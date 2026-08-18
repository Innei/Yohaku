export interface BlockAnchor {
  blockFingerprint: string
  blockId: string
  blockType: string
  lang?: string | null
  mode: 'block'
  snapshotText: string
}

export interface RangeAnchor {
  blockFingerprint: string
  blockId: string
  blockType: string
  endOffset: number
  lang?: string | null
  mode: 'range'
  prefix: string
  quote: string
  snapshotText: string
  startOffset: number
  suffix: string
}

export type CommentAnchor = BlockAnchor | RangeAnchor

export function computeBlockFingerprint(text: string): string {
  const input = text.slice(0, 200) + String(text.length)
  let hash = 5381
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + (input.codePointAt(i) ?? 0)) | 0
  }
  return (hash >>> 0).toString(16)
}

export function isRangeAnchor(anchor: unknown): anchor is RangeAnchor {
  if (!anchor || typeof anchor !== 'object') return false
  const value = anchor as Partial<RangeAnchor>
  return (
    value.mode === 'range' &&
    typeof value.blockId === 'string' &&
    typeof value.startOffset === 'number' &&
    typeof value.endOffset === 'number' &&
    typeof value.quote === 'string'
  )
}

export function isBlockAnchor(anchor: unknown): anchor is BlockAnchor {
  if (!anchor || typeof anchor !== 'object') return false
  const value = anchor as Partial<BlockAnchor>
  return (
    value.mode === 'block' &&
    typeof value.blockId === 'string' &&
    typeof value.snapshotText === 'string'
  )
}

export function rangeAnchorKey(
  anchor: Pick<RangeAnchor, 'blockId' | 'endOffset' | 'startOffset'>,
): string {
  return `${anchor.blockId}:${anchor.startOffset}:${anchor.endOffset}`
}

export function readerCommentBody(
  text: string,
  anchor?: CommentAnchor | null,
): { anchor: CommentAnchor; text: string } | { text: string } {
  return anchor ? { anchor, text } : { text }
}

export function rangeCommentsFromRoots<
  T extends { anchor?: CommentAnchor | null; id: string },
>(roots: T[] | undefined) {
  return (roots ?? []).flatMap((root) => {
    if (!isRangeAnchor(root.anchor)) return []
    return [{ id: root.id, anchor: root.anchor }]
  })
}

export function rootsForRange<T extends { anchor?: CommentAnchor | null }>(
  roots: T[] | undefined,
  anchor: RangeAnchor,
) {
  return (roots ?? []).filter(
    (root) =>
      isRangeAnchor(root.anchor) &&
      root.anchor.blockId === anchor.blockId &&
      root.anchor.startOffset === anchor.startOffset &&
      root.anchor.endOffset === anchor.endOffset,
  )
}

export function blockCommentsFromRoots<
  T extends { anchor?: CommentAnchor | null; id: string },
>(roots: T[] | undefined) {
  return (roots ?? []).flatMap((root) => {
    if (!isBlockAnchor(root.anchor)) return []
    return [{ id: root.id, anchor: root.anchor }]
  })
}

export function rootsForBlock<T extends { anchor?: CommentAnchor | null }>(
  roots: T[] | undefined,
  anchor: BlockAnchor,
) {
  return (roots ?? []).filter(
    (root) =>
      isBlockAnchor(root.anchor) && root.anchor.blockId === anchor.blockId,
  )
}
