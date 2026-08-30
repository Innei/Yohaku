import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

import type { ApiMyComment } from '@/api/types'
import { YohakuList } from '@/components/list/yohaku-list'
import { usePaperTabBarInset } from '@/components/navigation/paper-tab-bar-inset'
import { useRouteTransitionSettled } from '@/components/navigation/use-route-transition-settled'
import { AppText } from '@/components/ui'
import { useLocale, useTranslations } from '@/i18n'
import {
  flattenIndexList,
  INDEX_EMPTY_ID,
  INDEX_STATUS_ID,
  indexListEstimatedHeight,
} from '@/screens/lists/flatten-index-list'
import { usePalette } from '@/theme/palette'

import { ActivityEntry } from './activity-entry'
import { viewMyComment } from './activity-entry-model'
import { commentHref } from './activity-href'
import { ActivityLink, openActivityHref } from './activity-link'
import { myCommentDestination } from './my-comments-destination'
import { useMyCommentsQuery } from './use-my-comments'

const TITLE_ID = '__title'
const MORE_ID = '__more'

export function MyCommentsListScreen() {
  const t = useTranslations('me')
  const tComment = useTranslations('comment')
  const palette = usePalette()
  const locale = useLocale()
  const tabBarInset = usePaperTabBarInset()
  const queriesEnabled = useRouteTransitionSettled(`my-comments:${locale}`)
  const query = useMyCommentsQuery(locale, queriesEnabled)
  const comments = query.data?.pages.flatMap((page) => page.data) ?? []
  const commentsById = useMemo(() => {
    const map = new Map(comments.map((comment) => [comment.id, comment]))
    return map
  }, [comments])
  const listItems = useMemo(() => {
    const rows = [
      { id: TITLE_ID, type: 'title', estimatedHeight: 48 },
      ...flattenIndexList({
        rowIds: comments.map((comment) => comment.id),
        showEmpty: !query.isPending && !query.isError && comments.length === 0,
        showStatus: Boolean(query.isError && comments.length === 0),
      }),
    ]
    if (
      (query.isPending && comments.length === 0) ||
      query.isFetchingNextPage
    ) {
      rows.push({
        id: MORE_ID,
        type: 'more',
        estimatedHeight:
          comments.length === 0 ? indexListEstimatedHeight.empty : 48,
      })
    }
    return rows
  }, [
    comments,
    query.isError,
    query.isFetchingNextPage,
    query.isPending,
  ])

  return (
    <View style={[styles.screen, { backgroundColor: palette.surface.desk }]}>
      <YohakuList
        contentInsetBottom={tabBarInset}
        items={listItems}
        refreshing={query.isRefetching}
        style={styles.screen}
        renderItem={(item) => {
          if (item.id === TITLE_ID) {
            return <AppText variant="largeTitleSans">{t('comments')}</AppText>
          }
          if (item.id === INDEX_STATUS_ID) {
            return (
              <AppText
                color={palette.neutral[6]}
                style={styles.state}
                variant="secondary"
                onPress={() => void query.refetch()}
              >
                {tComment('failed')}
              </AppText>
            )
          }
          if (item.id === INDEX_EMPTY_ID) {
            return (
              <View style={styles.empty}>
                <AppText variant="entryTitleSans">{t('commentsEmpty')}</AppText>
                <AppText variant="body">{t('commentsEmptyHint')}</AppText>
              </View>
            )
          }
          if (item.id === MORE_ID) {
            return (
              <ActivityIndicator
                color={palette.neutral[5]}
                style={styles.state}
              />
            )
          }
          const comment = commentsById.get(item.id)
          if (!comment) return null
          return <MyCommentRow comment={comment} />
        }}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) {
            void query.fetchNextPage()
          }
        }}
        onRefresh={() => void query.refetch()}
      />
    </View>
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
  empty: {
    marginTop: 48,
    gap: 6,
    alignItems: 'center',
  },
  state: {
    marginTop: 48,
    textAlign: 'center',
  },
})
