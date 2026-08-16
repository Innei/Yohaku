import type { BlockAnchor, RangeAnchor } from '@/lib/comment-anchor'
import { isRangeAnchor, rangeAnchorKey } from '@/lib/comment-anchor'

import { resolveRangeAnchor } from './anchor-resolve'
import type { BlockInfo } from './anchor-utils'
import {
  buildBlockAnchorFromIndex,
  buildBlockAnchorFromSelection,
  buildRangeAnchorFromSelection,
} from './anchor-utils'

const HIGHLIGHT_NAME = 'comment-highlight'
const BLOCK_HIGHLIGHT_NAME = 'comment-block'

interface MutableHighlightRegistry {
  delete(name: string): boolean
  set(name: string, highlight: Highlight): this
}

export interface RangeComment {
  anchor: RangeAnchor
  id: string
}

export interface BlockComment {
  anchor: BlockAnchor
  id: string
}

function postNative(message: object) {
  try {
    ;(
      window as unknown as {
        ReactNativeWebView?: { postMessage: (data: string) => void }
      }
    ).ReactNativeWebView?.postMessage(JSON.stringify(message))
  } catch {}
}

function createDomRange(
  blockEl: Element,
  startOffset: number,
  endOffset: number,
): Range | null {
  const walker = document.createTreeWalker(
    blockEl,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
    {
      acceptNode(node) {
        if (node.nodeType === Node.TEXT_NODE) return NodeFilter.FILTER_ACCEPT
        if (node instanceof HTMLBRElement) return NodeFilter.FILTER_ACCEPT
        return NodeFilter.FILTER_SKIP
      },
    },
  )
  let offset = 0
  let startNode: Text | null = null
  let startNodeOffset = 0
  let endNode: Text | null = null
  let endNodeOffset = 0
  let node: Node | null

  while ((node = walker.nextNode())) {
    const len = node.nodeType === Node.TEXT_NODE ? (node as Text).length : 1

    if (
      !startNode &&
      node.nodeType === Node.TEXT_NODE &&
      offset + len >= startOffset
    ) {
      startNode = node as Text
      startNodeOffset = startOffset - offset
    }
    if (node.nodeType === Node.TEXT_NODE && offset + len >= endOffset) {
      endNode = node as Text
      endNodeOffset = endOffset - offset
      break
    }
    offset += len
  }

  if (!startNode || !endNode) return null

  try {
    const range = document.createRange()
    range.setStart(startNode, startNodeOffset)
    range.setEnd(endNode, endNodeOffset)
    return range
  } catch {
    return null
  }
}

function highlightApi(): MutableHighlightRegistry | null {
  return typeof CSS !== 'undefined' && 'highlights' in CSS
    ? (CSS.highlights as unknown as MutableHighlightRegistry)
    : null
}

function rangeForAnchor(
  contentEl: Element,
  blockInfos: BlockInfo[],
  anchor: RangeAnchor,
): Range | null {
  const resolved = resolveRangeAnchor(anchor, blockInfos)
  if (resolved.status === 'block-fallback') return null
  const blockEl = contentEl.children[resolved.blockIndex]
  if (!blockEl) return null
  return createDomRange(blockEl, resolved.startOffset, resolved.endOffset)
}

export function applyCommentHighlights(
  contentEl: Element | null,
  blockInfos: BlockInfo[],
  comments: RangeComment[],
) {
  const highlights = highlightApi()
  if (!highlights) return
  highlights.delete('comment-selection-active')
  if (!contentEl || comments.length === 0) {
    highlights.delete(HIGHLIGHT_NAME)
    return
  }
  const ranges = comments
    .map((item) => rangeForAnchor(contentEl, blockInfos, item.anchor))
    .filter((range): range is Range => range !== null)
  if (ranges.length === 0) {
    highlights.delete(HIGHLIGHT_NAME)
    return
  }
  highlights.set(HIGHLIGHT_NAME, new Highlight(...ranges))
}

export function requestSelectionComment(
  container: Element | null,
  blockInfos: BlockInfo[],
) {
  const sel = document.getSelection()
  const contentEl =
    container?.querySelector('.rich-content') ??
    container?.querySelector('[data-lexical-content]')
  if (!sel || sel.isCollapsed || !sel.toString() || !contentEl) {
    postNative({ type: 'yohaku:selection-comment-invalid' })
    return
  }
  const inside = (node: Node | null) => !!node && contentEl.contains(node)
  if (!inside(sel.anchorNode) || !inside(sel.focusNode)) {
    postNative({ type: 'yohaku:selection-comment-invalid' })
    return
  }
  const suppressed = (node: Node | null) => {
    const el = node instanceof Element ? node : (node?.parentElement ?? null)
    return !!el?.closest('[data-no-article-selection]')
  }
  if (suppressed(sel.anchorNode) || suppressed(sel.focusNode)) {
    postNative({ type: 'yohaku:selection-comment-invalid' })
    return
  }
  const anchor = buildRangeAnchorFromSelection(sel, contentEl, blockInfos, null)
  if (!anchor) {
    postNative({ type: 'yohaku:selection-comment-invalid' })
    return
  }
  postNative({
    type: 'yohaku:selection-comment',
    selectedText: sel.toString(),
    anchor,
  })
  sel.removeAllRanges()
}

export function applyBlockWashes(
  contentEl: Element | null,
  blockInfos: BlockInfo[],
  comments: BlockComment[],
) {
  const highlights = highlightApi()
  if (!highlights) return
  if (!contentEl || comments.length === 0) {
    highlights.delete(BLOCK_HIGHLIGHT_NAME)
    return
  }
  const ids = new Set(
    comments.map((item) => item.anchor.blockId).filter(Boolean),
  )
  const ranges: Range[] = []
  for (let i = 0; i < contentEl.children.length; i++) {
    const info = blockInfos[i]
    if (!info?.blockId || !ids.has(info.blockId)) continue
    try {
      const range = document.createRange()
      range.selectNodeContents(contentEl.children[i]!)
      ranges.push(range)
    } catch {}
  }
  if (ranges.length === 0) highlights.delete(BLOCK_HIGHLIGHT_NAME)
  else highlights.set(BLOCK_HIGHLIGHT_NAME, new Highlight(...ranges))
}

let lastBlockIndex: number | null = null

export function rememberSelectionBlock(
  container: Element | null,
  blockInfos: BlockInfo[],
) {
  const sel = document.getSelection()
  const contentEl =
    container?.querySelector('.rich-content') ??
    container?.querySelector('[data-lexical-content]')
  if (!sel?.anchorNode || !contentEl?.contains(sel.anchorNode)) return
  const anchor = buildBlockAnchorFromSelection(sel, contentEl, blockInfos, null)
  if (!anchor) return
  const index = blockInfos.findIndex((info) => info.blockId === anchor.blockId)
  if (index >= 0) lastBlockIndex = index
}

export function requestBlockComment(
  container: Element | null,
  blockInfos: BlockInfo[],
) {
  const sel = document.getSelection()
  const contentEl =
    container?.querySelector('.rich-content') ??
    container?.querySelector('[data-lexical-content]')
  if (!contentEl) {
    postNative({ type: 'yohaku:selection-block-invalid' })
    return
  }
  const fromSelection =
    sel && buildBlockAnchorFromSelection(sel, contentEl, blockInfos, null)
  const fromMemory =
    lastBlockIndex !== null
      ? buildBlockAnchorFromIndex(blockInfos, lastBlockIndex, null)
      : null
  const anchor = fromSelection ?? fromMemory
  if (!anchor) {
    postNative({ type: 'yohaku:selection-block-invalid' })
    return
  }
  postNative({ type: 'yohaku:selection-block', anchor })
  sel?.removeAllRanges()
}

export function hitTestRangeComment(
  contentEl: Element,
  blockInfos: BlockInfo[],
  comments: RangeComment[],
  clientX: number,
  clientY: number,
): RangeAnchor | null {
  const doc = contentEl.ownerDocument
  let node: Node
  let offset: number
  const caretPos = doc.caretPositionFromPoint?.(clientX, clientY)
  if (caretPos) {
    node = caretPos.offsetNode
    offset = caretPos.offset
  } else {
    const range = doc.caretRangeFromPoint?.(clientX, clientY)
    if (!range) return null
    node = range.startContainer
    offset = range.startOffset
  }

  const seen = new Set<string>()
  for (const item of comments) {
    if (!isRangeAnchor(item.anchor)) continue
    const key = rangeAnchorKey(item.anchor)
    if (seen.has(key)) continue
    seen.add(key)
    const range = rangeForAnchor(contentEl, blockInfos, item.anchor)
    if (!range) continue
    try {
      if (range.comparePoint(node, offset) === 0) return item.anchor
    } catch {}
  }
  return null
}

export function hitTestBlockComment(
  contentEl: Element,
  blockInfos: BlockInfo[],
  comments: BlockComment[],
  clientX: number,
  clientY: number,
): BlockAnchor | null {
  const el = contentEl.ownerDocument.elementFromPoint(clientX, clientY)
  if (!el || !contentEl.contains(el)) return null
  let child: Element | null = el
  while (child && child.parentElement !== contentEl) {
    child = child.parentElement
  }
  if (!child) return null
  const index = Array.prototype.indexOf.call(contentEl.children, child)
  const info = blockInfos[index]
  if (!info?.blockId) return null
  const hit = comments.find((item) => item.anchor.blockId === info.blockId)
  return hit?.anchor ?? null
}
