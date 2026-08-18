import type { Href } from 'expo-router'

import type { NoteRow, PostRow } from '@/db/schema'
import { siteHref } from '@/lib/site-url'

import type { LikedListItem } from './liked-list-model'
import type { MyCommentDestination } from './my-comments-destination'
import type { ReadingListItem } from './reading-list-model'

export type ActivityHref = {
  browser: boolean
  href: Href
  title: string
  webUrl: string | null
}

function postHref(row: PostRow): ActivityHref | null {
  if (!row.categorySlug) return null
  return {
    browser: row.contentFormat === 'markdown',
    href: {
      pathname: '/posts/[category]/[slug]',
      params: {
        category: row.categorySlug,
        postId: row.id,
        slug: row.slug,
      },
    },
    title: row.title,
    webUrl: siteHref(`/posts/${row.categorySlug}/${row.slug}`),
  }
}

function noteHref(row: NoteRow): ActivityHref {
  return {
    browser: Boolean(row.hasPassword || row.contentFormat === 'markdown'),
    href: { pathname: '/notes/[nid]', params: { nid: String(row.nid) } },
    title: row.title,
    webUrl: siteHref(`/notes/${row.nid}`),
  }
}

export function likedHref(item: LikedListItem): ActivityHref | null {
  if (item.kind === 'unavailable') return null
  if (item.kind === 'post') return postHref(item.post)
  if (item.kind === 'note') return noteHref(item.note)
  return {
    browser: false,
    href: { pathname: '/comments/[id]', params: { id: item.thinking.id } },
    title: item.thinking.content,
    webUrl: null,
  }
}

export function readingHref(item: ReadingListItem): ActivityHref | null {
  if (item.kind === 'unavailable') return null
  if (item.kind === 'post') return postHref(item.post)
  return noteHref(item.note)
}

export function commentHref(
  destination: MyCommentDestination,
  title: string,
): ActivityHref | null {
  if (destination.kind === 'unavailable') return null
  if (destination.kind === 'post') {
    return {
      browser: false,
      href: {
        pathname: '/posts/[category]/[slug]',
        params: {
          category: destination.category,
          commentId: destination.commentId,
          postId: destination.postId,
          slug: destination.slug,
        },
      },
      title,
      webUrl: siteHref(
        `/posts/${destination.category}/${destination.slug}`,
      ),
    }
  }
  if (destination.kind === 'note') {
    return {
      browser: false,
      href: {
        pathname: '/notes/[nid]',
        params: {
          commentId: destination.commentId,
          nid: String(destination.nid),
        },
      },
      title,
      webUrl: siteHref(`/notes/${destination.nid}`),
    }
  }
  return {
    browser: false,
    href: { pathname: '/comments/[id]', params: { id: destination.refId } },
    title,
    webUrl: null,
  }
}
