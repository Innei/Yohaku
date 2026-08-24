import { useRouter } from 'expo-router'
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'

import type { ApiMyComment } from '@/api/types'
import { EdgeEffectScrollView } from '@/components/navigation/edge-effect-scroll-view'
import { useRouteTransitionSettled } from '@/components/navigation/use-route-transition-settled'
import { AppText } from '@/components/ui'
import { useLocale, useTranslations } from '@/i18n'
import { usePalette } from '@/theme/palette'

import { ActivityEntry } from './activity-entry'
import { viewMyComment } from './activity-entry-model'
import { commentHref } from './activity-href'
import { ActivityLink, openActivityHref } from './activity-link'
import { myCommentDestination } from './my-comments-destination'
import { useMyCommentsQuery } from './use-my-comments'

export function MyCommentsListScreen() {
  const t = useTranslations('me')
  const tc = useTranslations('common')
  const tComment = useTranslations('comment')
  const palette = usePalette()
  const locale = useLocale()
  const queriesEnabled = useRouteTransitionSettled(`my-comments:${locale}`)
  const query = useMyCommentsQuery(locale, queriesEnabled)
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
          {comments.map((comment) => (
            <MyCommentRow comment={comment} key={comment.id} />
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

function MyCommentRow({ comment }: { comment: ApiMyComment }) {
  const t = useTranslations('me')
  const router = useRouter()
  const destination = myCommentDestination(comment)
  const view = viewMyComment(comment, t('unavailable'))
  const target = commentHref(destination, view.title)

  if (!target) {
    return (
      <ActivityEntry
        accent={view.accent}
        createdAt={view.createdAt}
        title={view.title}
      />
    )
  }

  const open = () => openActivityHref(target, router)

  return (
    <ActivityLink target={target} onOpen={open}>
      <ActivityEntry
        accent={view.accent}
        createdAt={view.createdAt}
        title={view.title}
        onAccessibilityTap={open}
      />
    </ActivityLink>
  )
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
  loadMore: {
    alignItems: 'center',
    paddingVertical: 16,
  },
})
