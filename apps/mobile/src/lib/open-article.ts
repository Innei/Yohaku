import type { Href } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'

import { prepareArticleBody } from '@/components/dom/prepare-reader'
import type { NoteRow, PostRow } from '@/db/schema'
import { siteHref } from '@/lib/site-url'

type Router = { push: (href: Href) => void }

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
  void prepare().finally(() => router.push(href))
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
