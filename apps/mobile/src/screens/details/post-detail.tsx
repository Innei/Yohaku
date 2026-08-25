import { and, eq } from 'drizzle-orm'
import { Stack, useIsPreview, useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ScrollView } from 'react-native'
import { StyleSheet, View } from 'react-native'

import { translatedBodyNeedsRefresh } from '@/api/article-meta'
import { api } from '@/api/client'
import { useSession } from '@/auth/session-store'
import { EdgeEffectScrollView } from '@/components/navigation/edge-effect-scroll-view'
import { AppText, NativePressable } from '@/components/ui'
import { db } from '@/db'
import { posts } from '@/db/schema'
import { useDatabaseSnapshot } from '@/db/use-database-snapshot'
import { useLocale, useTranslations } from '@/i18n'
import { recordReading } from '@/interactions/reading'
import { formatRelativeTime } from '@/lib/datetime'
import { extractHeadings } from '@/lib/lexical-headings'
import { siteHref } from '@/lib/site-url'
import { CommentComposeHost } from '@/screens/comments/comment-compose-provider'
import {
  useIsActiveMember,
  useMembershipPlans,
} from '@/screens/me/use-membership'
import { refreshPostBody } from '@/sync/engine'
import { bodyIsStale, postBodyFromApi, postMetaFromApi } from '@/sync/merge'
import { postConflictSet } from '@/sync/upsert-sets'
import { usePalette } from '@/theme/palette'
import { TtsMiniBar } from '@/tts/tts-mini-bar'
import { useTtsSession } from '@/tts/use-tts-session'

import { ArticleBody } from './article-body'
import { ArticleMetaLine } from './article-meta-line'
import { ArticleMore } from './article-more'
import { ArticleNotice } from './article-notice'
import { ArticleTail } from './article-tail'
import { useReservedBodyHeight } from './body-slot'
import { PaywallGate } from './paywall-gate'
import { shouldUnlockPaywalledContent } from './should-unlock-paywall'
import { useCollapsingTitle } from './use-collapsing-title'
import { useReadingPresence } from './use-reading-presence'
import { useRetryableBodyRefresh } from './use-retryable-body-refresh'

export function PostDetailScreen({
  categorySlug,
  postId: routePostId,
  slug,
}: {
  categorySlug: string
  postId?: string
  slug: string
}) {
  const isPreview = useIsPreview()
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('detail')
  const tc = useTranslations('common')
  const tl = useTranslations('list')
  const tt = useTranslations('tabs')
  const palette = usePalette()
  const session = useSession()
  const isMember = useIsActiveMember()
  const { data: plans } = useMembershipPlans()
  const reservedBodyHeight = useReservedBodyHeight()
  const scrollRef = useRef<ScrollView>(null)
  const unlockInflightRef = useRef(false)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [tocOpen, setTocOpen] = useState(false)

  const { snapshot, updatesEnabled } = useDatabaseSnapshot({
    identity: `post:${locale}:${routePostId ?? ''}:${categorySlug}:${slug}`,
    read: async () => {
      const rows = await db
        .select()
        .from(posts)
        .where(
          routePostId
            ? and(eq(posts.id, routePostId), eq(posts.lang, locale))
            : and(
                eq(posts.categorySlug, categorySlug),
                eq(posts.slug, slug),
                eq(posts.lang, locale),
              ),
        )
        .limit(1)
      return rows[0]
    },
    tables: ['posts'],
  })
  const post = snapshot ?? undefined
  const postId = post?.id
  const bodyVersion = post?.bodyVersion
  const isMarkdown = post?.contentFormat === 'markdown'
  const webUrl = siteHref(`/posts/${categorySlug}/${slug}`)
  const locked = post?.articleMeta?.paywall?.locked === true
  const isOwner = session?.role === 'owner'
  const showPaywallGate = locked && !isMember && !isOwner
  const shouldUnlock = shouldUnlockPaywalledContent({
    isMember,
    isOwner,
    locked,
  })

  useEffect(() => {
    if (isPreview || !postId || !updatesEnabled) return
    void recordReading(db, { refId: postId, kind: 'post', lang: locale })
  }, [isPreview, locale, postId, updatesEnabled])

  useRetryableBodyRefresh({
    enabled:
      updatesEnabled &&
      Boolean(post) &&
      !isMarkdown &&
      translatedBodyNeedsRefresh(post?.articleMeta),
    refresh: async () => {
      if (post) await refreshPostBody(post)
    },
    refreshKey: post
      ? `post:${post.id}:${post.lang}`
      : `post:${categorySlug}:${slug}:${locale}`,
  })

  useEffect(() => {
    if (!updatesEnabled) return
    let cancelled = false
    const load = async () => {
      if (post?.contentFormat === 'markdown') return
      if (post && !bodyIsStale(post)) return
      try {
        if (post) {
          await refreshPostBody(post)
        } else {
          const {
            data: detail,
            enrichments,
            meta,
          } = await api.postDetail(categorySlug, slug, locale)
          await db
            .insert(posts)
            .values({
              ...postMetaFromApi(detail, locale),
              ...postBodyFromApi(detail, enrichments, meta),
            })
            .onConflictDoUpdate({
              target: [posts.id, posts.lang],
              set: postConflictSet,
            })
        }
      } catch {
        if (!cancelled) setFailed(true)
      }
    }
    setFailed(false)
    void load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, bodyVersion, categorySlug, slug, locale, attempt, updatesEnabled])

  useEffect(() => {
    if (updatesEnabled && !isPreview && isMarkdown) {
      void WebBrowser.openBrowserAsync(webUrl)
    }
  }, [isMarkdown, isPreview, updatesEnabled, webUrl])

  const postRef = useRef(post)
  postRef.current = post

  useEffect(() => {
    const current = postRef.current
    if (
      !shouldUnlock ||
      !current ||
      !updatesEnabled ||
      unlockInflightRef.current
    ) {
      return
    }
    unlockInflightRef.current = true
    void refreshPostBody(current).finally(() => {
      unlockInflightRef.current = false
    })
  }, [postId, shouldUnlock, updatesEnabled])

  const body =
    post?.contentFormat === 'lexical' && post.content ? post.content : null
  const hasHeadings = useMemo(
    () => extractHeadings(body ?? '').length > 0,
    [body],
  )

  const { marks, onScrollMetrics } = useReadingPresence({
    articleId: isPreview ? undefined : post?.id,
    enabled: updatesEnabled,
    openOnWeb: isPreview || isMarkdown,
  })
  const headerSubtitle = post?.categoryName ?? post?.tags[0] ?? tt('posts')
  const { headerTitleProgress, headerOptions, onScroll, onTitleLayout } =
    useCollapsingTitle(post?.title, headerSubtitle, onScrollMetrics, marks)
  const tts = useTtsSession({
    articleId: post?.id,
    available: post?.articleMeta?.tts?.available === true,
    lang: locale,
    stale: post?.articleMeta?.tts?.stale === true,
    title: post?.title,
  })

  const metaParts = post
    ? [
        formatRelativeTime(post.createdAt, locale),
        post.text && post.bodyVersion !== null
          ? tl('wordCount', { count: post.text.length })
          : null,
        post.likeCount > 0 ? `♡ ${post.likeCount}` : null,
      ]
    : []

  return (
    <View style={styles.screen}>
      <Stack.Screen options={headerOptions} />
      <ArticleMore
        listenAvailable={tts.available}
        listening={tts.isNarrating}
        title={post?.title}
        tocAvailable={hasHeadings}
        url={webUrl}
        onListen={tts.start}
        onToc={() => setTocOpen(true)}
      />
      {post ? (
        <CommentComposeHost
          allowComment
          refId={post.id}
          refType="post"
          scrollRef={scrollRef}
        >
          {(compose) => (
            <>
              <EdgeEffectScrollView
                automaticallyAdjustKeyboardInsets={!compose.composing}
                headerTitleProgress={headerTitleProgress}
                ref={scrollRef}
                contentContainerStyle={[
                  styles.content,
                  tts.isNarrating && !compose.composing
                    ? styles.narratingPad
                    : null,
                ]}
                contentInset={
                  compose.composing
                    ? { bottom: compose.scrollBottomInset }
                    : undefined
                }
                style={[
                  styles.screen,
                  { backgroundColor: palette.surface.desk },
                ]}
                onScroll={onScroll}
                onScrollBeginDrag={tts.onScrollBeginDrag}
              >
                  <View style={styles.header} onLayout={onTitleLayout}>
              {post.categoryName && post.categorySlug ? (
                <NativePressable
                  accessibilityRole="link"
                  onPress={() =>
                    router.push({
                      pathname: '/categories/[slug]',
                      params: { slug: post.categorySlug! },
                    })
                  }
                >
                  <AppText color={palette.accent} variant="eyebrow">
                    {post.categoryName}
                  </AppText>
                </NativePressable>
              ) : post.categoryName ? (
                <AppText variant="eyebrow">{post.categoryName}</AppText>
              ) : null}
              <AppText variant="largeTitleSans">{post.title}</AppText>
              <ArticleMetaLine
                aiGen={post.articleMeta?.aiGen}
                parts={metaParts}
              />
              {post.tags.length > 0 ? (
                <View style={styles.tags}>
                  {post.tags.map((tag) => (
                    <NativePressable
                      accessibilityRole="link"
                      key={tag}
                      style={[
                        styles.tag,
                        {
                          backgroundColor: palette.surface.paper,
                          borderColor: `${palette.neutral[10]}0f`,
                        },
                      ]}
                      onPress={() =>
                        router.push({
                          pathname: '/posts/tag/[name]',
                          params: { name: tag },
                        })
                      }
                    >
                      <AppText color={palette.accent} variant="meta">
                        #{tag}
                      </AppText>
                    </NativePressable>
                  ))}
                </View>
              ) : null}
            </View>
            <ArticleNotice
              id={post.id}
              kind="post"
              meta={post.articleMeta}
              webUrl={webUrl}
              listen={{
                available: tts.available,
                current: tts.current,
                elapsed: tts.elapsed,
                status: tts.status,
                total: tts.total,
                onToggle: tts.toggle,
              }}
            />
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
                autoFollow={tts.autoFollow}
                content={body}
                enrichments={post?.enrichments ?? null}
                highlightBlockId={tts.activeBlockId}
                primeKey={post.id}
                queriesEnabled={updatesEnabled}
                refId={post.id}
                refType="post"
                scrollRef={scrollRef}
                    tocOpen={tocOpen}
                    variant="article"
                webUrl={webUrl}
                onTocClose={() => setTocOpen(false)}
              />
            ) : showPaywallGate ? null : (
              <View style={{ minHeight: reservedBodyHeight }}>
                <AppText
                  style={styles.placeholder}
                  variant="secondary"
                  onPress={failed ? () => setAttempt((n) => n + 1) : undefined}
                >
                  {failed ? t('bodyFailed') : t('bodyLoading')}
                </AppText>
              </View>
            )}
            <PaywallGate
              appleIapEnabled={plans?.appleIap?.enabled === true}
              loggedIn={Boolean(session)}
              visible={showPaywallGate}
            />
                <ArticleTail
                  kind="post"
                  likeCount={post.likeCount}
                  queriesEnabled={updatesEnabled}
                  refId={post.id}
                  title={post.title}
                  url={webUrl}
                />
              </EdgeEffectScrollView>
              {tts.isNarrating && !compose.composing ? (
                <TtsMiniBar
                  autoFollow={tts.autoFollow}
                  current={tts.current}
                  duration={tts.duration}
                  elapsed={tts.elapsed}
                  playbackRate={tts.playbackRate}
                  stale={tts.stale}
                  status={tts.status}
                  total={tts.total}
                  onRecenter={tts.recenter}
                  onSelectRate={tts.setRate}
                  onStop={tts.stop}
                  onToggle={tts.toggle}
                />
              ) : null}
            </>
          )}
        </CommentComposeHost>
      ) : (
        <EdgeEffectScrollView
          contentContainerStyle={styles.content}
          headerTitleProgress={headerTitleProgress}
          ref={scrollRef}
          style={[styles.screen, { backgroundColor: palette.surface.desk }]}
          onScroll={onScroll}
        >
          <AppText style={styles.placeholder} variant="secondary">
            {failed ? t('postFailed') : tc('loading')}
          </AppText>
        </EdgeEffectScrollView>
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
  narratingPad: {
    paddingBottom: 108,
  },
  header: {
    gap: 8,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
  },
  placeholder: {
    marginTop: 32,
    textAlign: 'center',
  },
})
