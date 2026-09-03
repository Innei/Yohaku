import { useQuery } from '@tanstack/react-query'
import { Stack, useRouter } from 'expo-router'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef } from 'react'
import type { ScrollView } from 'react-native'
import { Dimensions, StyleSheet, View } from 'react-native'

import { api } from '@/api/client'
import { EdgeEffectScrollView } from '@/components/navigation/edge-effect-scroll-view'
import { AppText } from '@/components/ui'
import { useLocale, useTranslations } from '@/i18n'
import { presentArticleToc, tocHref } from '@/lib/article-toc'
import { formatRelativeTime } from '@/lib/datetime'
import { extractHeadings } from '@/lib/lexical-headings'
import { openExternalUrl } from '@/lib/open-external'
import { siteHref } from '@/lib/site-url'
import { useOwner } from '@/owner/store'
import { CommentComposeHost } from '@/screens/comments/comment-compose-provider'
import { CommentSection } from '@/screens/comments/comment-section'
import { usePalette } from '@/theme/palette'

import { ArticleBody } from './article-body'
import { ArticleMetaLine } from './article-meta-line'
import { ArticleMore } from './article-more'
import { useArticlePrint } from './article-print-host'
import { BodyLoadingIndicator, useReservedBodyHeight } from './body-slot'
import { useCollapsingTitle } from './use-collapsing-title'

export function PageDetailScreen({ slug }: { slug: string }) {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('detail')
  const tc = useTranslations('common')
  const tl = useTranslations('list')
  const tm = useTranslations('me')
  const tp = useTranslations('print')
  const owner = useOwner()
  const { host: printHost, print } = useArticlePrint()
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
  const headings = useMemo(() => extractHeadings(body ?? ''), [body])

  useEffect(() => {
    if (isMarkdown) void openExternalUrl(webUrl)
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
      {printHost}
      <Stack.Screen options={headerOptions} />
      <ArticleMore
        printAvailable={Boolean(body)}
        title={page?.title}
        tocAvailable={headings.length > 0}
        url={webUrl}
        onPrint={
          page && body
            ? () =>
                print({
                  category: tm('pages'),
                  content: body,
                  createdAt: new Date(page.createdAt),
                  siteName: owner?.name || tp('site'),
                  title: page.title,
                  url: webUrl,
                  variant: 'article',
                })
            : undefined
        }
        onToc={() => {
          presentArticleToc(headings, Dimensions.get('window').height)
          router.push(tocHref())
        }}
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
                      onPress={() => void openExternalUrl(webUrl)}
                    >
                      {tc('openInBrowser')}
                    </AppText>
                  </View>
                ) : body ? (
                  <ArticleBody
                    content={body}
                    enrichments={enrichments}
                    refId={page.id}
                    refType="page"
                    scrollRef={scrollRef}
                    variant="article"
                    webUrl={webUrl}
                  />
                ) : (
                  <BodyLoadingIndicator minHeight={reservedBodyHeight} />
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
