import { type Href, useRouter } from 'expo-router'
import { Alert } from 'react-native'

import type { CommentRefType } from '@/api/types'
import { useTranslations } from '@/i18n'
import {
  blockCommentsFromRoots,
  isBlockAnchor,
  isRangeAnchor,
  rangeCommentsFromRoots,
} from '@/lib/comment-anchor'
import {
  presentSelectionComment,
  type SelectionSheetState,
  useSelectionCommentSession,
} from '@/lib/selection-comment-session'
import { useCommentAnchorsQuery } from '@/screens/comments/use-comments'

export function useArticleSelection({
  onPresent,
  queriesEnabled = true,
  refId,
  refType,
}: {
  onPresent: (blockId: string) => void
  queriesEnabled?: boolean
  refId: string
  refType: CommentRefType
}) {
  const tComment = useTranslations('comment')
  const router = useRouter()
  const session = useSelectionCommentSession()
  const selectionSheet = session?.refId === refId ? session.state : null
  const anchorsQuery = useCommentAnchorsQuery(refId, queriesEnabled)
  const rangeComments = rangeCommentsFromRoots(anchorsQuery.data?.data)
  const blockComments = blockCommentsFromRoots(anchorsQuery.data?.data)

  const setSelectionSheet = (state: SelectionSheetState) => {
    onPresent(state.anchor.blockId)
    if (presentSelectionComment({ refId, refType, state }) === 'push') {
      router.push('/selection-comment' as Href)
    }
  }

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
    handleSelectionMessage,
  }
}
