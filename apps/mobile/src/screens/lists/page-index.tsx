import { useQuery } from '@tanstack/react-query'
import { Stack, useRouter } from 'expo-router'
import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'

import { api } from '@/api/client'
import { YohakuList } from '@/components/list/yohaku-list'
import { usePaperTabBarInset } from '@/components/navigation/paper-tab-bar-inset'
import { AppText, NativePressable } from '@/components/ui'
import { useLocale, useTranslations } from '@/i18n'
import { useCollapsingTitle } from '@/screens/details/use-collapsing-title'
import { TopicBackControl } from '@/screens/topics/topic-chrome'
import { usePalette } from '@/theme/palette'

import { flattenIndexList, INDEX_EMPTY_ID } from './flatten-index-list'

export function PageIndexScreen() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('me')
  const tl = useTranslations('list')
  const palette = usePalette()
  const tabBarInset = usePaperTabBarInset()

  const query = useQuery({
    queryFn: () => api.pageList(locale),
    queryKey: ['pages', locale],
    staleTime: 10 * 60_000,
  })
  const pages = query.data?.data ?? []
  const { headerOptions, onNativeScroll } = useCollapsingTitle(
    t('pages'),
    '',
    undefined,
    undefined,
    {
      alwaysVisible: true,
      titleFontSize: 18,
      titleFontWeight: 'bold',
    },
  )
  const listItems = useMemo(
    () =>
      flattenIndexList({
        rowIds: pages.map((page) => page.id),
        showEmpty: pages.length === 0,
        showStatus: false,
      }),
    [pages],
  )
  const pagesById = useMemo(() => {
    const map = new Map(pages.map((page) => [page.id, page]))
    return map
  }, [pages])

  return (
    <View style={[styles.screen, { backgroundColor: palette.surface.desk }]}>
      <Stack.Screen options={headerOptions} />
      <TopicBackControl />
      <YohakuList
        contentInsetBottom={tabBarInset}
        items={listItems}
        refreshing={query.isRefetching}
        style={styles.screen}
        renderItem={(item) => {
          if (item.id === INDEX_EMPTY_ID) {
            return (
              <AppText style={styles.empty} variant="secondary">
                {query.isPending ? tl('syncing') : tl('empty')}
              </AppText>
            )
          }
          const page = pagesById.get(item.id)
          if (!page) return null
          const index = pages.findIndex((entry) => entry.id === page.id)
          return (
            <NativePressable
              style={[
                styles.item,
                index > 0
                  ? {
                      borderTopColor: palette.neutral[3],
                      borderTopWidth: StyleSheet.hairlineWidth,
                    }
                  : null,
              ]}
              onPress={() =>
                router.push({
                  pathname: '/pages/[slug]',
                  params: { slug: page.slug },
                })
              }
            >
              <AppText variant="entryTitleSans">{page.title}</AppText>
              {page.subtitle ? (
                <AppText color={palette.neutral[7]} variant="secondary">
                  {page.subtitle}
                </AppText>
              ) : null}
            </NativePressable>
          )
        }}
        onRefresh={() => void query.refetch()}
        onScroll={onNativeScroll}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  item: {
    gap: 6,
    paddingVertical: 16,
  },
  empty: {
    marginTop: 48,
    textAlign: 'center',
  },
})
