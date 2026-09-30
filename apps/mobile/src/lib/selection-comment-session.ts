import { useSyncExternalStore } from 'react'

import type { CommentRefType } from '@/api/types'
import type { CommentAnchor } from '@/lib/comment-anchor'

export type SelectionSheetState =
  | { anchor: CommentAnchor; kind: 'compose'; selectedText: string }
  | { anchor: CommentAnchor; kind: 'thread' }

export interface SelectionCommentSession {
  refId: string
  refType: CommentRefType
  state: SelectionSheetState
}

let session: SelectionCommentSession | null = null
let mounted = false
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

// ponytail: a present during the dismiss animation lands in the dying sheet and is dropped; push a fresh route if that ever matters.
export function presentSelectionComment(next: SelectionCommentSession): 'push' | 'replace' {
  session = next
  emit()
  return mounted ? 'replace' : 'push'
}

export function markSelectionCommentMounted(value: boolean) {
  mounted = value
  if (value || session === null) return
  session = null
  emit()
}

export function getSelectionCommentSession() {
  return session
}

export function subscribeSelectionComment(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useSelectionCommentSession() {
  return useSyncExternalStore(
    subscribeSelectionComment,
    getSelectionCommentSession,
    getSelectionCommentSession,
  )
}
