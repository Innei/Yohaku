import { resolveRangeAnchor } from '@/components/dom/anchor-resolve'
import {
  type BlockInfo,
  buildBlockAnchorFromIndex,
} from '@/components/dom/anchor-utils'
import {
  type BlockAnchor,
  type CommentAnchor,
  computeBlockFingerprint,
  isRangeAnchor,
  type RangeAnchor,
} from '@/lib/comment-anchor'

import type { RichTextHighlight } from './inline-runs'
import { runsText } from './lexical/collect-runs'
import type { RichSegment } from './lexical/group'
import type { RichTextMenuActionEvent } from './rich-text-view'

interface NativeBlockEntry {
  baseId: string
  id: string
  length: number
  prefixLength: number
}

// Lists are one block on the web (`ul` textContent) but one native block per
// item; entries carry the cumulative offset so anchors convert both ways.
export type NativeBlockMap = Map<string, NativeBlockEntry>

export function indexNativeBlocks(segments: RichSegment[]): NativeBlockMap {
  const map: NativeBlockMap = new Map()
  const prefixByBase = new Map<string, number>()
  for (const segment of segments) {
    if (segment.kind !== 'text') continue
    for (const block of segment.blocks) {
      const baseId = block.id.split('#')[0] ?? block.id
      const prefixLength = prefixByBase.get(baseId) ?? 0
      const length = runsText(block.runs).length
      map.set(block.id, { id: block.id, baseId, length, prefixLength })
      prefixByBase.set(baseId, prefixLength + length)
    }
  }
  return map
}

function entriesForBase(
  map: NativeBlockMap,
  baseId: string,
): NativeBlockEntry[] {
  return [...map.values()].filter((entry) => entry.baseId === baseId)
}

function toNativeOffset(
  map: NativeBlockMap,
  baseId: string,
  offset: number,
): { id: string; offset: number } | null {
  const entries = entriesForBase(map, baseId)
  if (entries.length === 0) return null
  const hit =
    entries.find(
      (entry) =>
        offset >= entry.prefixLength &&
        offset < entry.prefixLength + entry.length,
    ) ?? entries.at(-1)!
  return {
    id: hit.id,
    offset: Math.max(0, Math.min(offset - hit.prefixLength, hit.length)),
  }
}

export function buildHighlights({
  activeAnchor,
  blockComments,
  blockInfos,
  highlightBlockId,
  map,
  rangeComments,
}: {
  activeAnchor: CommentAnchor | null
  blockComments: Array<{ anchor: BlockAnchor; id: string }>
  blockInfos: BlockInfo[]
  highlightBlockId: string | null
  map: NativeBlockMap
  rangeComments: Array<{ anchor: RangeAnchor; id: string }>
}): RichTextHighlight[] {
  const out: RichTextHighlight[] = []

  const pushRange = (
    id: string,
    anchor: RangeAnchor,
    kind: RichTextHighlight['kind'],
  ) => {
    const resolved = resolveRangeAnchor(anchor, blockInfos)
    const info = blockInfos[resolved.blockIndex]
    if (!info?.blockId) return
    if (resolved.status === 'block-fallback') {
      pushBlock(id, info.blockId, kind)
      return
    }
    const start = toNativeOffset(map, info.blockId, resolved.startOffset)
    if (!start) return
    const entry = map.get(start.id)!
    const end = Math.min(resolved.endOffset - entry.prefixLength, entry.length)
    if (end <= start.offset) return
    out.push({ id, blockId: start.id, start: start.offset, end, kind })
  }

  const pushBlock = (
    id: string,
    baseId: string,
    kind: RichTextHighlight['kind'],
  ) => {
    for (const entry of entriesForBase(map, baseId)) {
      if (entry.length === 0) continue
      out.push({ id, blockId: entry.id, start: 0, end: entry.length, kind })
    }
  }

  for (const comment of blockComments) {
    pushBlock(comment.id, comment.anchor.blockId, 'block')
  }
  for (const comment of rangeComments) {
    pushRange(comment.id, comment.anchor, 'comment')
  }
  if (highlightBlockId) pushBlock('tts', highlightBlockId, 'block')
  if (activeAnchor) {
    if (isRangeAnchor(activeAnchor)) pushRange('active', activeAnchor, 'active')
    else pushBlock('active', activeAnchor.blockId, 'active')
  }
  return out
}

export type SelectionMessage =
  | { anchor: BlockAnchor; type: 'yohaku:selection-block' }
  | {
      anchor: RangeAnchor
      selectedText: string
      type: 'yohaku:selection-comment'
    }
  | { type: 'yohaku:selection-block-invalid' }
  | { type: 'yohaku:selection-comment-invalid' }

export function selectionMessageFromMenuAction(
  event: RichTextMenuActionEvent,
  blockInfos: BlockInfo[],
  map: NativeBlockMap,
): SelectionMessage {
  const startEntry = map.get(event.start.blockId)
  const endEntry = map.get(event.end.blockId)
  const wantsBlock = event.id === 'comment-block'
  const invalid = wantsBlock
    ? ({ type: 'yohaku:selection-block-invalid' } as const)
    : ({ type: 'yohaku:selection-comment-invalid' } as const)
  if (!startEntry || !endEntry || startEntry.baseId !== endEntry.baseId) {
    return invalid
  }
  const index = blockInfos.findIndex(
    (info) => info.blockId === startEntry.baseId,
  )
  const info = blockInfos[index]
  if (!info) return invalid

  if (wantsBlock) {
    const anchor = buildBlockAnchorFromIndex(blockInfos, index, null)
    return anchor ? { type: 'yohaku:selection-block', anchor } : invalid
  }

  const startOffset = startEntry.prefixLength + event.start.offset
  const endOffset = endEntry.prefixLength + event.end.offset
  if (endOffset <= startOffset || !event.text) return invalid
  const text = info.textContent
  return {
    type: 'yohaku:selection-comment',
    selectedText: event.text,
    anchor: {
      mode: 'range',
      blockId: info.blockId,
      blockType: info.type,
      blockFingerprint: computeBlockFingerprint(text),
      snapshotText: text.slice(0, 300),
      quote: event.text,
      prefix: text.slice(Math.max(0, startOffset - 50), startOffset),
      suffix: text.slice(endOffset, endOffset + 50),
      startOffset,
      endOffset,
      lang: null,
    },
  }
}
