import type { Href } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'

import { prepareArticleBody } from '@/components/dom/prepare-reader'
import type { NoteRow, PostRow } from '@/db/schema'
import { primeDatabaseSnapshot } from '@/db/use-database-snapshot'
import { siteHref } from '@/lib/site-url'

type Router = {
  prefetch: (href: Href) => void
  push: (href: Href) => void
}

type OpenPostRow = Pick<
  PostRow,
  'categorySlug' | 'contentFormat' | 'id' | 'slug'
> &
  Partial<Pick<PostRow, 'content' | 'enrichments'>>

function openAfterPrepare(
  router: Router,
  href: Href,
  prepare?: () => Promise<unknown>,
) {
  if (!prepare) {
    router.push(href)
    return
  }
  router.prefetch(href)
  void prepare().finally(() => router.push(href))
}

function isFullPostRow(post: OpenPostRow): post is OpenPostRow & PostRow {
  return 'lang' in post
}

export function openNote(router: Router, note: NoteRow) {
  const webUrl = siteHref(`/notes/${note.nid}`)
  if (note.hasPassword || note.contentFormat === 'markdown') {
    void WebBrowser.openBrowserAsync(webUrl)
    return
  }
  const href = {
    pathname: '/notes/[nid]',
    params: { nid: String(note.nid) },
  } as const
  if (note.contentFormat === 'lexical' && note.content) {
    primeDatabaseSnapshot(`note:${note.lang}:${note.nid}`, {
      note,
      topic: null,
    })
    openAfterPrepare(router, href, () =>
      prepareArticleBody({
        content: note.content!,
        enrichments: note.enrichments ?? undefined,
        id: note.id,
        variant: 'note',
        webUrl,
      }),
    )
    return
  }
  router.push(href)
}

export function openPost(router: Router, post: OpenPostRow) {
  if (!post.categorySlug) return
  const webUrl = siteHref(`/posts/${post.categorySlug}/${post.slug}`)
  if (post.contentFormat === 'markdown') {
    void WebBrowser.openBrowserAsync(webUrl)
    return
  }
  const href = {
    pathname: '/posts/[category]/[slug]',
    params: { category: post.categorySlug, postId: post.id, slug: post.slug },
  } as const
  if (post.contentFormat === 'lexical' && post.content) {
    if (isFullPostRow(post)) {
      primeDatabaseSnapshot(
        `post:${post.lang}:${post.id}:${post.categorySlug}:${post.slug}`,
        post,
      )
    }
    openAfterPrepare(router, href, () =>
      prepareArticleBody({
        content: post.content!,
        enrichments: post.enrichments ?? undefined,
        id: post.id,
        variant: 'article',
        webUrl,
      }),
    )
    return
  }
  router.push(href)
}
