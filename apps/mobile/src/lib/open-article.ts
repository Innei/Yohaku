import type { Href } from 'expo-router'

import type { NoteRow, PostRow } from '@/db/schema'
import { primeDatabaseSnapshot } from '@/db/use-database-snapshot'
import { openExternalUrl } from '@/lib/open-external'
import { siteHref } from '@/lib/site-url'

type Router = {
  push: (href: Href) => void
}

type OpenPostRow = Pick<
  PostRow,
  'categorySlug' | 'contentFormat' | 'id' | 'slug'
> &
  Partial<Pick<PostRow, 'content' | 'enrichments'>>

function isFullPostRow(post: OpenPostRow): post is OpenPostRow & PostRow {
  return 'lang' in post
}

export function openNote(
  router: Router,
  note: NoteRow,
  prepareSharedHero?: () => void,
) {
  const webUrl = siteHref(`/notes/${note.nid}`)
  if (note.hasPassword || note.contentFormat === 'markdown') {
    void openExternalUrl(webUrl)
    return
  }
  const href = {
    pathname: '/notes/[nid]',
    params: {
      nid: String(note.nid),
      ...(prepareSharedHero ? { hero: 'shared' } : null),
    },
  } as const
  if (note.contentFormat === 'lexical' && note.content) {
    primeDatabaseSnapshot(`note:${note.lang}:${note.nid}`, {
      note,
      topic: null,
    })
  }
  prepareSharedHero?.()
  router.push(href)
}

export function openPost(router: Router, post: OpenPostRow) {
  if (!post.categorySlug) return
  const webUrl = siteHref(`/posts/${post.categorySlug}/${post.slug}`)
  if (post.contentFormat === 'markdown') {
    void openExternalUrl(webUrl)
    return
  }
  const href = {
    pathname: '/posts/[category]/[slug]',
    params: { category: post.categorySlug, postId: post.id, slug: post.slug },
  } as const
  if (post.contentFormat === 'lexical' && post.content && isFullPostRow(post)) {
    primeDatabaseSnapshot(
      `post:${post.lang}:${post.id}:${post.categorySlug}:${post.slug}`,
      post,
    )
  }
  router.push(href)
}
