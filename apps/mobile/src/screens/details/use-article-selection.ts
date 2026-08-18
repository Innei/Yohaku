import { useState } from 'react'
import { Alert } from 'react-native'

import { useTranslations } from '@/i18n'
import {
  blockCommentsFromRoots,
  isBlockAnchor,
  isRangeAnchor,
  rangeCommentsFromRoots,
  rootsForBlock,
  rootsForRange,
} from '@/lib/comment-anchor'
import type { SelectionSheetState } from '@/screens/comments/selection-comment-sheet'
import { useCommentAnchorsQuery } from '@/screens/comments/use-comments'

export function useArticleSelection(refId: string, queriesEnabled = true) {
  const tComment = useTranslations('comment')
  const [selectionSheet, setSelectionSheet] =
    useState<SelectionSheetState | null>(null)
  const anchorsQuery = useCommentAnchorsQuery(refId, queriesEnabled)
  const rangeComments = rangeCommentsFromRoots(anchorsQuery.data?.data)
  const blockComments = blockCommentsFromRoots(anchorsQuery.data?.data)
  const threadRoots = selectionSheet
    ? isRangeAnchor(selectionSheet.anchor)
      ? rootsForRange(anchorsQuery.data?.data, selectionSheet.anchor)
      : rootsForBlock(anchorsQuery.data?.data, selectionSheet.anchor)
    : []

  const handleSelectionMessage = (payload: {
    anchor?: unknown
    selectedText?: unknown
    type?: string
  }) => {
    if (payload.type === 'yohaku:selection-comment-invalid') {
      Alert.alert('', tComment('selectionInvalid'))
      return true
    }
    if (payload.type === 'yohaku:selection-block-invalid') {
      Alert.alert('', tComment('blockInvalid'))
      return true
    }
    if (payload.type === 'yohaku:selection-comment') {
      if (
        isRangeAnchor(payload.anchor) &&
        typeof payload.selectedText === 'string'
      ) {
        setSelectionSheet({
          anchor: payload.anchor,
          kind: 'compose',
          selectedText: payload.selectedText,
        })
      }
      return true
    }
    if (payload.type === 'yohaku:selection-block') {
      if (isBlockAnchor(payload.anchor)) {
        setSelectionSheet({
          anchor: payload.anchor,
          kind: 'compose',
          selectedText: payload.anchor.snapshotText,
        })
      }
      return true
    }
    if (payload.type === 'yohaku:range-comment') {
      if (isRangeAnchor(payload.anchor)) {
        setSelectionSheet({ anchor: payload.anchor, kind: 'thread' })
      }
      return true
    }
    if (payload.type === 'yohaku:block-comment') {
      if (isBlockAnchor(payload.anchor)) {
        setSelectionSheet({ anchor: payload.anchor, kind: 'thread' })
      }
      return true
    }
    return false
  }

  return {
    blockComments,
    rangeComments,
    selectionBlockTitle: tComment('blockAction'),
    selectionCommentTitle: tComment('selectionAction'),
    selectionSheet,
    threadRoots,
    closeSelectionSheet: () => setSelectionSheet(null),
    handleSelectionMessage,
  }
}
