import { useInfiniteQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'

import { api } from '@/api/client'
import type { ApiMyComment } from '@/api/types'
import { EdgeEffectScrollView } from '@/components/navigation/edge-effect-scroll-view'
import { AppText, NativePressable } from '@/components/ui'
import { useLocale, useTranslations } from '@/i18n'
import { formatRelativeTime } from '@/lib/datetime'
import { usePalette } from '@/theme/palette'

import { myCommentDestination } from './my-comments-destination'

export function MyCommentsListScreen() {
  const t = useTranslations('me')
  const tc = useTranslations('common')
  const tComment = useTranslations('comment')
  const palette = usePalette()
  const query = useInfiniteQuery({
    queryKey: ['me-comments'],
    queryFn: ({ pageParam }) => api.myComments(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.totalPages
        ? last.pagination.page + 1
        : undefined,
  })
  const comments = query.data?.pages.flatMap((page) => page.data) ?? []

  return (
    <EdgeEffectScrollView
      contentContainerStyle={styles.content}
      style={[styles.screen, { backgroundColor: palette.surface.desk }]}
    >
      <AppText variant="largeTitleSans">{t('comments')}</AppText>
      {query.isPending ? (
        <ActivityIndicator color={palette.neutral[5]} style={styles.state} />
      ) : query.isError && comments.length === 0 ? (
        <AppText
          color={palette.neutral[6]}
          style={styles.state}
          variant="secondary"
          onPress={() => void query.refetch()}
        >
          {tComment('failed')}
        </AppText>
      ) : comments.length === 0 ? (
        <View style={styles.empty}>
          <AppText variant="entryTitleSans">{t('commentsEmpty')}</AppText>
          <AppText variant="body">{t('commentsEmptyHint')}</AppText>
        </View>
      ) : (
        <>
          {comments.map((comment, index) => (
            <MyCommentRow
              comment={comment}
              first={index === 0}
              key={comment.id}
            />
          ))}
          {query.hasNextPage ? (
            <Pressable
              disabled={query.isFetchingNextPage}
              style={styles.loadMore}
              onPress={() => void query.fetchNextPage()}
            >
              <AppText color={palette.neutral[6]} variant="secondary">
                {query.isFetchingNextPage
                  ? tc('loading')
                  : tComment('loadMore')}
              </AppText>
            </Pressable>
          ) : null}
        </>
      )}
    </EdgeEffectScrollView>
  )
}

function MyCommentRow({
  comment,
  first,
}: {
  comment: ApiMyComment
  first: boolean
}) {
  const t = useTranslations('me')
  const locale = useLocale()
  const palette = usePalette()
  const router = useRouter()
  const destination = myCommentDestination(comment)
  const sourceLabel =
    destination.kind === 'unavailable'
      ? t('unavailable')
      : (comment.sourceTitle ?? t('unavailable'))
  const rule = first
    ? undefined
    : [styles.rowRule, { borderTopColor: palette.neutral[3] }]

  const body = (
    <View style={[styles.row, rule]}>
      <AppText numberOfLines={2} variant="entryTitleSans">
        {comment.text}
      </AppText>
      <AppText color={palette.neutral[6]} numberOfLines={1} variant="body">
        {sourceLabel}
      </AppText>
      <AppText color={palette.neutral[5]} variant="meta">
        {formatRelativeTime(new Date(comment.createdAt), locale)}
      </AppText>
    </View>
  )

  if (destination.kind === 'unavailable') return body

  const onPress = () => {
    if (destination.kind === 'post') {
      router.push({
        pathname: '/posts/[category]/[slug]',
        params: {
          category: destination.category,
          slug: destination.slug,
          commentId: destination.commentId,
        },
      })
      return
    }
    if (destination.kind === 'note') {
      router.push({
        pathname: '/notes/[nid]',
        params: {
          nid: String(destination.nid),
          commentId: destination.commentId,
        },
      })
      return
    }
    router.push({
      pathname: '/comments/[id]',
      params: { id: destination.refId },
    })
  }

  return <NativePressable onPress={onPress}>{body}</NativePressable>
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 4,
  },
  empty: {
    marginTop: 48,
    gap: 6,
    alignItems: 'center',
  },
  state: {
    marginTop: 48,
    textAlign: 'center',
  },
  row: {
    paddingVertical: 14,
    gap: 4,
  },
  rowRule: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  loadMore: {
    alignItems: 'center',
    paddingVertical: 16,
  },
})
