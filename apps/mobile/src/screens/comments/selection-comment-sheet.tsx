import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type as typeScale } from '@yohaku/design-system/tokens'
import { useEffect, useState } from 'react'
import { Modal, ScrollView, StyleSheet, View } from 'react-native'

import { api } from '@/api/client'
import { ApiError } from '@/api/errors'
import type { ApiComment, ApiCommentRoot, CommentRefType } from '@/api/types'
import { useSession } from '@/auth/session-store'
import { AppText } from '@/components/ui'
import { useTranslations } from '@/i18n'
import { type CommentAnchor, isRangeAnchor } from '@/lib/comment-anchor'
import { replyTargetAuthor } from '@/lib/comment-thread'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'

import { CommentCell } from './comment-cell'
import { CommentInputWell } from './comment-input-well'
import { commentAnchorsQueryKey, commentsQueryKey } from './use-comments'

export type SelectionSheetState =
  | { anchor: CommentAnchor; kind: 'compose'; selectedText: string }
  | { anchor: CommentAnchor; kind: 'thread' }

export function SelectionCommentSheet({
  refId,
  refType,
  roots,
  state,
  onClose,
}: {
  onClose: () => void
  refId: string
  refType: CommentRefType
  roots: ApiCommentRoot[]
  state: SelectionSheetState | null
}) {
  const t = useTranslations('comment')
  const palette = usePalette()
  const session = useSession()
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState('')
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(
    null,
  )
  const [sendError, setSendError] = useState<string | null>(null)

  useEffect(() => {
    setDraft('')
    setReplyTo(null)
    setSendError(null)
  }, [state])

  const onReply = (comment: ApiComment) => {
    setReplyTo({
      id: comment.id,
      name: comment.reader?.name ?? comment.author,
    })
  }

  const send = useMutation({
    mutationFn: (vars: { parentId: string | null; text: string }) =>
      vars.parentId
        ? api.readerReply(vars.parentId, vars.text)
        : api.readerComment(refId, refType, vars.text, state?.anchor),
    onSuccess: async () => {
      setDraft('')
      setReplyTo(null)
      setSendError(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: commentsQueryKey(refId) }),
        queryClient.invalidateQueries({
          queryKey: commentAnchorsQueryKey(refId),
        }),
      ])
      if (!replyTo) onClose()
    },
    onError: (error) => {
      const fallback = t('sendFailed')
      setSendError(
        error instanceof ApiError
          ? (error.serverMessage ?? fallback)
          : fallback,
      )
    },
  })

  return (
    <Modal
      animationType="slide"
      presentationStyle="pageSheet"
      visible={state !== null}
      onRequestClose={onClose}
    >
      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={styles.content}
        style={{ backgroundColor: palette.surface.desk, flex: 1 }}
      >
        {state ? (
          <>
            <AppText color={palette.neutral[7]} variant="secondary">
              {isRangeAnchor(state.anchor)
                ? t('selectionTitle')
                : t('blockTitle')}
            </AppText>
            <AppText
              color={palette.neutral[8]}
              numberOfLines={4}
              style={styles.quote}
            >
              {isRangeAnchor(state.anchor)
                ? state.anchor.quote
                : state.anchor.snapshotText}
            </AppText>
            <View
              style={[styles.hairline, { backgroundColor: palette.neutral[3] }]}
            />
            {state.kind === 'thread'
              ? roots.map((root) => (
                  <View key={root.id} style={styles.thread}>
                    <CommentCell
                      comment={root}
                      showQuote={false}
                      showReply={session !== null}
                      onReply={onReply}
                    />
                    {(root.replies ?? []).map((reply) => (
                      <CommentCell
                        isReply
                        comment={reply}
                        key={reply.id}
                        showQuote={false}
                        showReply={session !== null}
                        replyTargetName={replyTargetAuthor(reply, {
                          replies: root.replies ?? [],
                          root,
                        })}
                        onReply={onReply}
                      />
                    ))}
                  </View>
                ))
              : null}
            {state.kind === 'thread' ? (
              <View
                style={[
                  styles.hairline,
                  { backgroundColor: palette.neutral[3] },
                ]}
              />
            ) : null}
            <CommentInputWell
              busy={send.isPending}
              error={sendError}
              replyToName={replyTo?.name ?? null}
              signedIn={session !== null}
              value={draft}
              onCancelReply={() => setReplyTo(null)}
              onChangeText={(text) => {
                setDraft(text)
                if (sendError) setSendError(null)
              }}
              onSend={() =>
                send.mutate({
                  parentId: replyTo?.id ?? null,
                  text: draft.trim(),
                })
              }
            />
          </>
        ) : null}
      </ScrollView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 40,
    gap: 16,
  },
  quote: {
    ...fonts.serif,
    fontSize: typeScale.copy15.size,
    lineHeight: typeScale.copy15.lineHeight,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
  },
  thread: {
    gap: 12,
  },
})
