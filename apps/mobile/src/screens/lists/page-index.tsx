import { useQuery } from '@tanstack/react-query'
import { Stack, useRouter } from 'expo-router'
import { RefreshControl, StyleSheet, View } from 'react-native'

import { api } from '@/api/client'
import { EdgeEffectScrollView } from '@/components/navigation/edge-effect-scroll-view'
import { AppText, NativePressable } from '@/components/ui'
import { useLocale, useTranslations } from '@/i18n'
import { useCollapsingTitle } from '@/screens/details/use-collapsing-title'
import { TopicBackControl } from '@/screens/topics/topic-chrome'
import { usePalette } from '@/theme/palette'

export function PageIndexScreen() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('me')
  const tl = useTranslations('list')
  const palette = usePalette()

  const query = useQuery({
    queryFn: () => api.pageList(locale),
    queryKey: ['pages', locale],
    staleTime: 10 * 60_000,
  })
  const items = query.data?.data ?? []
  const { headerTitleProgress, headerOptions, onScroll } = useCollapsingTitle(
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

  return (
    <View style={[styles.screen, { backgroundColor: palette.surface.desk }]}>
      <Stack.Screen options={headerOptions} />
      <TopicBackControl />
      <EdgeEffectScrollView
        contentContainerStyle={styles.content}
        headerTitleProgress={headerTitleProgress}
        scrollEventThrottle={16}
        style={styles.screen}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => void query.refetch()}
          />
        }
        onScroll={onScroll}
      >
        {items.length === 0 ? (
          <AppText style={styles.empty} variant="secondary">
            {query.isPending ? tl('syncing') : tl('empty')}
          </AppText>
        ) : (
          items.map((page, index) => (
            <NativePressable
              key={page.id}
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
          ))
        )}
      </EdgeEffectScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
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
