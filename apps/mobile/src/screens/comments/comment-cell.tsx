import { type as typeScale } from '@yohaku/design-system/tokens'
import { useRef } from 'react'
import { Alert, StyleSheet, View } from 'react-native'

import { api } from '@/api/client'
import type { ApiComment } from '@/api/types'
import { AppText, NativePressable, RemoteImage, SinkPressable } from '@/components/ui'
import { useLocale, useTranslations } from '@/i18n'
import { isRangeAnchor } from '@/lib/comment-anchor'
import { commentAvatar, commentDisplayName } from '@/lib/comment-thread'
import { formatRelativeTime } from '@/lib/datetime'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'

import { CommentMarkdown } from './comment-markdown'

export function CommentCell({
  comment,
  isReply = false,
  replyTargetName,
  showQuote = true,
  showReply,
  onReply,
}: {
  comment: ApiComment
  isReply?: boolean
  replyTargetName?: string | null
  showQuote?: boolean
  showReply: boolean
  onReply: (comment: ApiComment, anchor?: View) => void
}) {
  const t = useTranslations('comment')
  const ta = useTranslations('auth')
  const tc = useTranslations('common')
  const locale = useLocale()
  const palette = usePalette()
  const rowRef = useRef<View>(null)
  const avatar = commentAvatar(comment)
  const name = commentDisplayName(comment)
  const avatarSize = isReply ? 24 : 32

  const report = () => {
    Alert.alert(t('report'), t('reportConfirm'), [
      { style: 'cancel', text: tc('cancel') },
      {
        style: 'destructive',
        text: t('report'),
        onPress: () => {
          void api
            .reportComment(comment.id)
            .then(() => {
              Alert.alert(t('report'), t('reportDone'))
            })
            .catch(() => {
              Alert.alert(t('report'), t('reportFailed'))
            })
        },
      },
    ])
  }

  return (
    <View collapsable={false} ref={rowRef}>
      <NativePressable
        haptic={false}
        style={styles.rowPress}
        onLongPress={report}
      >
        <View
          style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
            backgroundColor: palette.neutral[3],
            overflow: 'hidden',
          }}
        >
          {avatar ? (
            <RemoteImage
              contentFit="cover"
              style={{ width: avatarSize, height: avatarSize }}
              uri={avatar}
            />
          ) : null}
        </View>
        <View style={styles.main}>
          <View style={styles.nameRow}>
            <AppText
              color={palette.neutral[8]}
              numberOfLines={1}
              style={styles.name}
              variant="secondary"
            >
              {name}
            </AppText>
            {replyTargetName ? (
              <>
                <AppText color={palette.neutral[6]} style={styles.arrow}>
                  ›
                </AppText>
                <AppText
                  color={palette.accent}
                  numberOfLines={1}
                  style={styles.to}
                  variant="meta"
                >
                  {replyTargetName}
                </AppText>
              </>
            ) : null}
            {comment.reader?.role === 'owner' ? (
              <AppText color={palette.accent} variant="meta">
                {ta('owner')}
              </AppText>
            ) : null}
            {comment.pin ? (
              <AppText color={palette.accent} variant="meta">
                {t('pinned')}
              </AppText>
            ) : null}
            <AppText variant="meta">
              {formatRelativeTime(new Date(comment.createdAt), locale)}
            </AppText>
          </View>
          {showQuote &&
          !isReply &&
          isRangeAnchor(comment.anchor) &&
          comment.anchor.quote ? (
            <AppText
              color={palette.neutral[7]}
              numberOfLines={2}
              style={styles.quote}
            >
              「{comment.anchor.quote}」
            </AppText>
          ) : null}
          <CommentMarkdown text={comment.text} />
        </View>
      </NativePressable>
      {showReply ? (
        <SinkPressable
          accessibilityLabel={t('reply')}
          hitSlop={8}
          style={[styles.replyAction, { marginLeft: avatarSize + 10 }]}
          onPress={() => onReply(comment, rowRef.current ?? undefined)}
        >
          <AppText color={palette.neutral[6]} variant="meta">
            {t('reply')}
          </AppText>
        </SinkPressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  rowPress: {
    flexDirection: 'row',
    gap: 10,
  },
  main: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  name: {
    flexShrink: 1,
  },
  arrow: {
    fontSize: 11,
    lineHeight: typeScale.label12.lineHeight,
  },
  to: {
    flexShrink: 1,
  },
  quote: {
    ...fonts.serif,
    fontSize: typeScale.copy13.size,
    lineHeight: typeScale.copy13.lineHeight,
  },
  replyAction: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
})
