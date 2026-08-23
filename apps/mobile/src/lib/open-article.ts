import type { Href } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'

import { primeArticleBody } from '@/components/dom/prime-body'
import type { NoteRow, PostRow } from '@/db/schema'
import { siteHref } from '@/lib/site-url'

type Router = { push: (href: Href) => void }

export function openNote(router: Router, note: NoteRow) {
  const webUrl = siteHref(`/notes/${note.nid}`)
  if (note.hasPassword || note.contentFormat === 'markdown') {
    void WebBrowser.openBrowserAsync(webUrl)
    return
  }
  if (note.contentFormat === 'lexical' && note.content) {
    primeArticleBody({
      content: note.content,
      enrichments: note.enrichments ?? undefined,
      key: note.id,
      variant: 'note',
      webUrl,
    })
  }
  router.push({ pathname: '/notes/[nid]', params: { nid: String(note.nid) } })
}

export function openPost(router: Router, post: PostRow) {
  if (!post.categorySlug) return
  const webUrl = siteHref(`/posts/${post.categorySlug}/${post.slug}`)
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
    params: { category: post.categorySlug, postId: post.id, slug: post.slug },
  })
}
