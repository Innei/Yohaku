import { useQuery } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ScrollView } from 'react-native'
import { StyleSheet, View } from 'react-native'

import { api } from '@/api/client'
import { EdgeEffectScrollView } from '@/components/navigation/edge-effect-scroll-view'
import { AppText } from '@/components/ui'
import { useLocale, useTranslations } from '@/i18n'
import { formatRelativeTime } from '@/lib/datetime'
import { extractHeadings } from '@/lib/lexical-headings'
import { siteHref } from '@/lib/site-url'
import { CommentComposeHost } from '@/screens/comments/comment-compose-provider'
import { CommentSection } from '@/screens/comments/comment-section'
import { usePalette } from '@/theme/palette'

import { ArticleBody } from './article-body'
import { ArticleMetaLine } from './article-meta-line'
import { ArticleMore } from './article-more'
import { useReservedBodyHeight } from './body-slot'
import { useCollapsingTitle } from './use-collapsing-title'

export function PageDetailScreen({ slug }: { slug: string }) {
  const locale = useLocale()
  const t = useTranslations('detail')
  const tc = useTranslations('common')
  const tl = useTranslations('list')
  const palette = usePalette()
  const scrollRef = useRef<ScrollView>(null)
  const reservedBodyHeight = useReservedBodyHeight()

  const query = useQuery({
    queryFn: () => api.pageDetail(slug, locale),
    queryKey: ['page', slug, locale],
    staleTime: 5 * 60_000,
  })
  const page = query.data?.data
  const enrichments = query.data?.enrichments ?? null
  const webUrl = siteHref(`/${slug}`)
  const isMarkdown = page?.contentFormat === 'markdown'
  const body =
    page?.contentFormat === 'lexical' && page.content ? page.content : null
  const hasHeadings = useMemo(
    () => extractHeadings(body ?? '').length > 0,
    [body],
  )
  const [tocOpen, setTocOpen] = useState(false)

  useEffect(() => {
    if (isMarkdown) void WebBrowser.openBrowserAsync(webUrl)
  }, [isMarkdown, webUrl])

  const { headerTitleProgress, headerOptions, onScroll, onTitleLayout } =
    useCollapsingTitle(page?.title, page?.subtitle ?? '')

  const metaParts = page
    ? [
        formatRelativeTime(new Date(page.createdAt), locale),
        page.text ? tl('wordCount', { count: page.text.length }) : null,
      ]
    : []

  const scroll = (children: ReactNode, bottomInset?: number) => (
    <EdgeEffectScrollView
      contentContainerStyle={styles.content}
      contentInset={bottomInset ? { bottom: bottomInset } : undefined}
      headerTitleProgress={headerTitleProgress}
      ref={scrollRef}
      style={[styles.screen, { backgroundColor: palette.surface.desk }]}
      onScroll={onScroll}
    >
      {children}
    </EdgeEffectScrollView>
  )

  return (
    <View style={styles.screen}>
      <Stack.Screen options={headerOptions} />
      <ArticleMore
        title={page?.title}
        tocAvailable={hasHeadings}
        url={webUrl}
        onToc={() => setTocOpen(true)}
      />
      {page ? (
        <CommentComposeHost
          allowComment
          refId={page.id}
          refType="page"
          scrollRef={scrollRef}
        >
          {(compose) =>
            scroll(
              <>
                <View style={styles.header} onLayout={onTitleLayout}>
                  <AppText variant="largeTitleSans">{page.title}</AppText>
                  {page.subtitle ? (
                    <AppText variant="secondary">{page.subtitle}</AppText>
                  ) : null}
                  <ArticleMetaLine parts={metaParts} />
                </View>
                {isMarkdown ? (
                  <View style={{ minHeight: reservedBodyHeight }}>
                    <AppText
                      style={styles.placeholder}
                      variant="secondary"
                      onPress={() => void WebBrowser.openBrowserAsync(webUrl)}
                    >
                      {tc('openInBrowser')}
                    </AppText>
                  </View>
                ) : body ? (
                  <ArticleBody
                    content={body}
                    enrichments={enrichments}
                    primeKey={page.id}
                    refId={page.id}
                    refType="page"
                    scrollRef={scrollRef}
                    tocOpen={tocOpen}
                    variant="article"
                    webUrl={webUrl}
                    onTocClose={() => setTocOpen(false)}
                  />
                ) : (
                  <View style={{ minHeight: reservedBodyHeight }}>
                    <AppText style={styles.placeholder} variant="secondary">
                      {t('bodyLoading')}
                    </AppText>
                  </View>
                )}
                <CommentSection refId={page.id} refType="page" />
              </>,
              compose.composing ? compose.scrollBottomInset : undefined,
            )
          }
        </CommentComposeHost>
      ) : (
        scroll(
          <AppText
            style={styles.placeholder}
            variant="secondary"
            onPress={query.isError ? () => void query.refetch() : undefined}
          >
            {query.isError ? t('bodyFailed') : tc('loading')}
          </AppText>,
        )
      )}
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
