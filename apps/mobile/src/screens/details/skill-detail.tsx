import { useQuery } from '@tanstack/react-query'
import { Stack, useLocalSearchParams } from 'expo-router'
import { Share, StyleSheet, View } from 'react-native'

import { api } from '@/api/client'
import { EdgeEffectScrollView } from '@/components/navigation/edge-effect-scroll-view'
import { AppText, MarkdownBody } from '@/components/ui'
import { useTranslations } from '@/i18n'
import { siteHref } from '@/lib/site-url'
import { skillBody } from '@/lib/skill-markdown'
import { usePalette } from '@/theme/palette'

import { ArticleMore } from './article-more'
import { useCollapsingTitle } from './use-collapsing-title'

export function SkillDetailScreen() {
  const { name, description } = useLocalSearchParams<{
    description?: string
    name: string
  }>()
  const t = useTranslations('notice')
  const tc = useTranslations('common')
  const palette = usePalette()

  const query = useQuery({
    queryFn: () => api.skillMarkdown(name),
    queryKey: ['skill', name],
    staleTime: 5 * 60_000,
  })
  const body = query.data ? skillBody(query.data) : null
  const webUrl = siteHref(`/skills/${encodeURIComponent(name)}`)
  const promptUrl = siteHref(`/skills/${encodeURIComponent(name)}/SKILL.md`)
  const sharePrompt = () =>
    void Share.share({
      message: `${t('skillPromptText', { url: promptUrl })}\n\n`,
    })
  const { headerTitleProgress, headerOptions, onScroll } = useCollapsingTitle(
    name,
    t('skills'),
  )

  return (
    <View style={[styles.screen, { backgroundColor: palette.surface.desk }]}>
      <Stack.Screen options={headerOptions} />
      <ArticleMore
        promptLabel={t('skillCopyPrompt')}
        title={name}
        url={webUrl}
        onPrompt={sharePrompt}
      />
      <EdgeEffectScrollView
        contentContainerStyle={styles.content}
        headerTitleProgress={headerTitleProgress}
        style={styles.screen}
        onScroll={onScroll}
      >
        <View style={styles.header}>
          <AppText variant="largeTitleSans">{name}</AppText>
          {description ? (
            <AppText color={palette.neutral[7]} variant="secondary">
              {description}
            </AppText>
          ) : null}
          <AppText
            color={palette.accent}
            variant="meta"
            onPress={sharePrompt}
          >
            {t('skillCopyPrompt')}
          </AppText>
        </View>
        {body ? (
          <MarkdownBody markdown={body} />
        ) : (
          <AppText
            style={styles.placeholder}
            variant="secondary"
            onPress={query.isError ? () => void query.refetch() : undefined}
          >
            {query.isError ? tc('retry') : tc('loading')}
          </AppText>
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
    paddingBottom: 48,
    gap: 20,
  },
  header: {
    gap: 8,
  },
  placeholder: {
    marginTop: 32,
    textAlign: 'center',
  },
})
