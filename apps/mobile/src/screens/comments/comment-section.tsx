import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type as typeScale } from '@yohaku/design-system/tokens'
import { useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'

import { api } from '@/api/client'
import { ApiError } from '@/api/errors'
import type { ApiComment, CommentRefType } from '@/api/types'
import { useSession } from '@/auth/session-store'
import { AppText, SlotText } from '@/components/ui'
import { useTranslations } from '@/i18n'
import type { ThreadExpansion } from '@/lib/comment-thread'
import {
  buildThread,
  commentDisplayName,
  replyTargetAuthor,
} from '@/lib/comment-thread'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'

import { CommentCell } from './comment-cell'
import { CommentInputWell } from './comment-input-well'
import { commentsQueryKey, useCommentsQuery } from './use-comments'

export function CommentSection({
  refId,
  refType,
  allowComment = true,
  queriesEnabled = true,
}: {
  allowComment?: boolean
  queriesEnabled?: boolean
  refId: string
  refType: CommentRefType
}) {
  const t = useTranslations('comment')
  const tc = useTranslations('common')
  const palette = usePalette()
  const session = useSession()
  const queryClient = useQueryClient()
  const query = useCommentsQuery(refId, queriesEnabled)

  const [expansions, setExpansions] = useState<Record<string, ThreadExpansion>>(
    {},
  )
  const [expandBusy, setExpandBusy] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(
    null,
  )
  const [sendError, setSendError] = useState<string | null>(null)

  const send = useMutation({
    mutationFn: (vars: { parentId: string | null; text: string }) =>
      vars.parentId
        ? api.readerReply(vars.parentId, vars.text)
        : api.readerComment(refId, refType, vars.text),
    onSuccess: async () => {
      setDraft('')
      setReplyTo(null)
      setSendError(null)
      await queryClient.invalidateQueries({ queryKey: commentsQueryKey(refId) })
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

  const pages = query.data?.pages
  const total = pages?.[0]?.pagination.total ?? null
  const threads = useMemo(
    () =>
      (pages?.flatMap((page) => page.data) ?? []).map((root) =>
        buildThread(root, expansions[root.id]),
      ),
    [pages, expansions],
  )

  const expand = async (rootId: string, cursor: string | null) => {
    if (expandBusy !== null) return
    setExpandBusy(rootId)
    try {
      const page = await api.commentThread(rootId, cursor ?? undefined)
      setExpansions((prev) => {
        const existing = prev[rootId]
        return {
          ...prev,
          [rootId]: {
            replies: [...(existing?.replies ?? []), ...page.replies],
            nextCursor: page.nextCursor,
            done: page.done,
          },
        }
      })
    } catch {
      // leave the expand affordance in place for a retry
    } finally {
      setExpandBusy(null)
    }
  }

  const onReply = (comment: ApiComment) => {
    setReplyTo({ id: comment.id, name: commentDisplayName(comment) })
  }

  const countStyle = {
    ...fonts.sans,
    fontSize: typeScale.label12.size,
    lineHeight: typeScale.label12.lineHeight,
    color: palette.neutral[6],
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <AppText variant="entryTitle">{t('title')}</AppText>
        {total !== null ? (
          <SlotText textStyle={countStyle} value={total} />
        ) : null}
      </View>

      {allowComment ? (
        <CommentInputWell
          busy={send.isPending}
          error={sendError}
          providersEnabled={queriesEnabled}
          replyToName={replyTo?.name ?? null}
          signedIn={session !== null}
          value={draft}
          onCancelReply={() => setReplyTo(null)}
          onChangeText={(text) => {
            setDraft(text)
            if (sendError) setSendError(null)
          }}
          onSend={() =>
            send.mutate({ parentId: replyTo?.id ?? null, text: draft.trim() })
          }
        />
      ) : (
        <AppText color={palette.neutral[6]} variant="secondary">
          {t('closed')}
        </AppText>
      )}

      {query.isPending ? (
        <ActivityIndicator color={palette.neutral[5]} style={styles.state} />
      ) : query.isError ? (
        <AppText
          color={palette.neutral[6]}
          style={styles.state}
          variant="secondary"
          onPress={() => void query.refetch()}
        >
          {t('failed')}
        </AppText>
      ) : threads.length === 0 ? (
        <AppText
          color={palette.neutral[5]}
          style={styles.state}
          variant="secondary"
        >
          {t('empty')}
        </AppText>
      ) : (
        <View style={styles.list}>
          {threads.map((thread) => (
            <View key={thread.root.id} style={styles.thread}>
              <CommentCell
                comment={thread.root}
                showReply={allowComment && session !== null}
                onReply={onReply}
              />
              {thread.replies.length > 0 ? (
                <View style={styles.replies}>
                  {thread.replies.map((reply) => (
                    <CommentCell
                      isReply
                      comment={reply}
                      key={reply.id}
                      replyTargetName={replyTargetAuthor(reply, thread)}
                      showReply={allowComment && session !== null}
                      onReply={onReply}
                    />
                  ))}
                  {thread.hiddenCount > 0 ? (
                    <Pressable
                      disabled={expandBusy !== null}
                      hitSlop={8}
                      onPress={() =>
                        void expand(thread.root.id, thread.nextCursor)
                      }
                    >
                      <AppText color={palette.neutral[6]} variant="meta">
                        {expandBusy === thread.root.id
                          ? t('expanding')
                          : t('expandReplies', { count: thread.hiddenCount })}
                      </AppText>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
            </View>
          ))}
          {query.hasNextPage ? (
            <Pressable
              disabled={query.isFetchingNextPage}
              style={styles.loadMore}
              onPress={() => void query.fetchNextPage()}
            >
              <AppText color={palette.neutral[6]} variant="secondary">
                {query.isFetchingNextPage ? tc('loading') : t('loadMore')}
              </AppText>
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  state: {
    marginVertical: 16,
    textAlign: 'center',
  },
  list: {
    gap: 20,
  },
  thread: {
    gap: 12,
  },
  replies: {
    marginLeft: 42,
    gap: 12,
  },
  loadMore: {
    alignItems: 'center',
    paddingVertical: 4,
  },
})
