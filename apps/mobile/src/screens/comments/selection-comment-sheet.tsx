import { type as typeScale } from '@yohaku/design-system/tokens'
import { useRouter } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import { useEffect, useMemo, useRef } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'

import { useSession } from '@/auth/session-store'
import { AppText, NativePressable } from '@/components/ui'
import { useLocale, useTranslations } from '@/i18n'
import {
  type CommentAnchor,
  isRangeAnchor,
  rootsForBlock,
  rootsForRange,
} from '@/lib/comment-anchor'
import { replyTargetAuthor } from '@/lib/comment-thread'
import {
  markSelectionCommentMounted,
  type SelectionCommentSession,
  useSelectionCommentSession,
} from '@/lib/selection-comment-session'
import { usePalette } from '@/theme/palette'
import { useNativeSerifFontStyle } from '@/theme/serif-font'

import { CommentCell } from './comment-cell'
import { CommentComposeEntry } from './comment-compose-entry'
import { CommentComposeHost } from './comment-compose-provider'
import { CommentLoginInline } from './comment-login-inline'
import { useCommentAnchorsQuery } from './use-comments'

export type { SelectionSheetState } from '@/lib/selection-comment-session'

function anchorResetKey(anchor: CommentAnchor): string {
  if (isRangeAnchor(anchor)) {
    return `${anchor.blockId}:${anchor.startOffset}:${anchor.endOffset}`
  }
  return `${anchor.blockId}:block`
}

function quoteMarks(locale: string, text: string) {
  return locale === 'en' || locale === 'ko' ? `“${text}”` : `「${text}」`
}

export function SelectionCommentSheet() {
  const router = useRouter()
  const current = useSelectionCommentSession()

  useEffect(() => {
    markSelectionCommentMounted(true)
    return () => markSelectionCommentMounted(false)
  }, [])

  useEffect(() => {
    if (current === null) router.back()
  }, [current, router])

  if (current === null) return null
  return (
    <SelectionCommentContent
      refId={current.refId}
      refType={current.refType}
      state={current.state}
      onClose={() => router.back()}
    />
  )
}

function SelectionCommentContent({
  onClose,
  refId,
  refType,
  state,
}: SelectionCommentSession & { onClose: () => void }) {
  const t = useTranslations('comment')
  const tc = useTranslations('common')
  const locale = useLocale()
  const palette = usePalette()
  const serifFont = useNativeSerifFontStyle()
  const session = useSession()
  const scrollRef = useRef<ScrollView>(null)
  const anchorsQuery = useCommentAnchorsQuery(refId)
  const roots = useMemo(
    () =>
      state.kind === 'thread'
        ? isRangeAnchor(state.anchor)
          ? rootsForRange(anchorsQuery.data?.data, state.anchor)
          : rootsForBlock(anchorsQuery.data?.data, state.anchor)
        : [],
    [anchorsQuery.data?.data, state],
  )
  const count = roots.reduce(
    (sum, root) => sum + 1 + (root.replies?.length ?? 0),
    0,
  )
  const quote = isRangeAnchor(state.anchor)
    ? state.anchor.quote
    : state.anchor.snapshotText
  const title =
    state.kind === 'thread' && count > 0
      ? t('threadCount', { count })
      : isRangeAnchor(state.anchor)
        ? t('selectionTitle')
        : t('blockTitle')

  return (
    <CommentComposeHost
      anchor={state.anchor}
      autoFocus={state.kind === 'compose'}
      refId={refId}
      refType={refType}
      resetKey={`${state.kind}:${anchorResetKey(state.anchor)}`}
      scrollRef={scrollRef}
      onRootSent={onClose}
    >
      {(compose) => (
        <ScrollView
          automaticallyAdjustKeyboardInsets={!compose.composing}
          contentContainerStyle={styles.content}
          ref={scrollRef}
          style={{ backgroundColor: palette.surface.paper }}
          contentInset={
            compose.composing ? { bottom: compose.scrollBottomInset } : undefined
          }
        >
          <View style={styles.header}>
            <AppText style={styles.title}>{title}</AppText>
            <NativePressable
              accessibilityLabel={tc('close')}
              accessibilityRole="button"
              hitSlop={8}
              style={[styles.close, { backgroundColor: palette.surface.well }]}
              onPress={onClose}
            >
              <SymbolView
                name="xmark"
                size={11}
                tintColor={palette.neutral[7]}
                weight="semibold"
              />
            </NativePressable>
          </View>
          <AppText
            color={palette.neutral[7]}
            numberOfLines={4}
            style={[styles.quote, serifFont]}
          >
            {quoteMarks(locale, quote)}
          </AppText>
          {roots.map((root) => (
            <View key={root.id} style={styles.thread}>
              <CommentCell
                comment={root}
                showQuote={false}
                showReply={session !== null}
                onReply={compose.reply}
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
                  onReply={compose.reply}
                />
              ))}
            </View>
          ))}
          {compose.composing ? null : session ? (
            <CommentComposeEntry
              placeholder={t('placeholder')}
              onPress={compose.composeRoot}
            />
          ) : (
            <CommentLoginInline />
          )}
        </ScrollView>
      )}
    </CommentComposeHost>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    paddingBottom: 40,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
  },
  close: {
    alignItems: 'center',
    borderRadius: 15,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  quote: {
    fontSize: typeScale.copy15.size,
    lineHeight: typeScale.copy15.lineHeight,
  },
  thread: {
    gap: 12,
  },
})
