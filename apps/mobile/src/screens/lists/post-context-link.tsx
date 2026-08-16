import { Link, useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { type MouseEvent as ReactMouseEvent, useCallback, useMemo } from 'react'
import type { GestureResponderEvent } from 'react-native'

import { primeArticleBody } from '@/components/dom/prime-body'
import type { PostRow } from '@/db/schema'
import { useTranslations } from '@/i18n'
import { copyUrl } from '@/lib/copy-url'
import { shareUrl } from '@/lib/share'
import { siteHref } from '@/lib/site-url'

import { PostFeaturedSheet, PostIndexItem } from './post-list-rows'

type LinkPressEvent =
  GestureResponderEvent | ReactMouseEvent<HTMLAnchorElement, MouseEvent>

export function PostContextLink({
  featured = false,
  post,
}: {
  featured?: boolean
  post: PostRow
}) {
  const router = useRouter()
  const t = useTranslations('common')
  const categorySlug = post.categorySlug
  const webUrl = categorySlug
    ? siteHref(`/posts/${categorySlug}/${post.slug}`)
    : null
  const href = useMemo(
    () =>
      categorySlug
        ? ({
            pathname: '/posts/[category]/[slug]' as const,
            params: { category: categorySlug, slug: post.slug },
          } as const)
        : null,
    [categorySlug, post.slug],
  )

  const openPost = useCallback(() => {
    if (!categorySlug || !webUrl) return
    if (post.contentFormat === 'markdown') {
      void WebBrowser.openBrowserAsync(webUrl)
      return
    }
    if (post.contentFormat === 'lexical' && post.content) {
      primeArticleBody({
        content: post.content,
        enrichments: post.enrichments ?? undefined,
        key: post.id,
        variant: 'article',
        webUrl,
      })
    }
    router.push({
      pathname: '/posts/[category]/[slug]',
      params: { category: categorySlug, slug: post.slug },
    })
  }, [categorySlug, post, router, webUrl])

  const handleLinkPress = useCallback(
    (event: LinkPressEvent) => {
      event.preventDefault()
      openPost()
    },
    [openPost],
  )
  const trigger = featured ? (
    <PostFeaturedSheet post={post} onAccessibilityTap={openPost} />
  ) : (
    <PostIndexItem post={post} onAccessibilityTap={openPost} />
  )

  if (!href || !webUrl) return trigger

  return (
    <Link asChild href={href} onPress={handleLinkPress}>
      <Link.Trigger>{trigger}</Link.Trigger>
      <Link.Preview />
      <Link.Menu>
        <Link.MenuAction
          icon="square.and.arrow.up"
          onPress={() => void shareUrl(webUrl, post.title)}
        >
          {t('share')}
        </Link.MenuAction>
        <Link.MenuAction icon="link" onPress={() => void copyUrl(webUrl)}>
          {t('copyLink')}
        </Link.MenuAction>
        <Link.MenuAction
          icon="safari"
          onPress={() => void WebBrowser.openBrowserAsync(webUrl)}
        >
          {t('openInBrowser')}
        </Link.MenuAction>
      </Link.Menu>
    </Link>
  )
}
