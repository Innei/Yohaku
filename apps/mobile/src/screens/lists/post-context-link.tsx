import { Link, useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { type MouseEvent as ReactMouseEvent, useCallback, useMemo } from 'react'
import type { GestureResponderEvent } from 'react-native'

import { useTranslations } from '@/i18n'
import { copyUrl } from '@/lib/copy-url'
import { openPost } from '@/lib/open-article'
import { shareUrl } from '@/lib/share'
import { siteHref } from '@/lib/site-url'

import type { PostListRow } from './post-list'
import {
  PostFeaturedSheet,
  PostFeaturedTrigger,
  PostIndexItem,
  PostIndexTrigger,
  PostRowPressable,
} from './post-list-rows'

type LinkPressEvent =
  GestureResponderEvent | ReactMouseEvent<HTMLAnchorElement, MouseEvent>

export function PostContextLink({
  featured = false,
  post,
}: {
  featured?: boolean
  post: PostListRow
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
            params: {
              category: categorySlug,
              postId: post.id,
              slug: post.slug,
            },
          } as const)
        : null,
    [categorySlug, post.id, post.slug],
  )

  const handleOpenPost = useCallback(() => {
    openPost(router, post)
  }, [post, router])

  const handleLinkPress = useCallback(
    (event: LinkPressEvent) => {
      event.preventDefault()
      handleOpenPost()
    },
    [handleOpenPost],
  )
  const openCategory = useCallback(() => {
    if (!categorySlug) return
    router.push({
      pathname: '/categories/[slug]',
      params: { slug: categorySlug },
    })
  }, [categorySlug, router])
  const openTag = useCallback(
    (tag: string) => {
      router.push({
        pathname: '/posts/tag/[name]',
        params: { name: tag },
      })
    },
    [router],
  )

  const hit = (
    <PostRowPressable
      disabled={!post.categorySlug}
      onAccessibilityTap={handleOpenPost}
    >
      {featured ? (
        <PostFeaturedTrigger post={post} />
      ) : (
        <PostIndexTrigger post={post} />
      )}
    </PostRowPressable>
  )

  const trigger =
    href && webUrl ? (
      <Link asChild href={href} onPress={handleLinkPress}>
        <Link.Trigger>{hit}</Link.Trigger>
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
    ) : (
      hit
    )

  const shell = featured ? (
    <PostFeaturedSheet
      post={post}
      trigger={trigger}
      onCategoryPress={openCategory}
      onTagPress={openTag}
    />
  ) : (
    <PostIndexItem
      post={post}
      trigger={trigger}
      onCategoryPress={openCategory}
      onTagPress={openTag}
    />
  )

  return shell
}
