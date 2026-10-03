import { and, eq } from 'drizzle-orm'
import type { Href } from 'expo-router'

import { db } from '@/db'
import { type NoteRow, type PostRow, posts } from '@/db/schema'
import { primeDatabaseSnapshot } from '@/db/use-database-snapshot'
import { getLocale } from '@/i18n/locale-store'
import { openExternalUrl } from '@/lib/open-external'
import { siteHref } from '@/lib/site-url'
import { markdownOpensOnWeb } from '@/rich/markdown/support'

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

// The detail screen configures its header from the row. Mounting without one
// renders a placeholder and reconfigures the header mid-push, which moves the
// back button; list rows are trimmed, so the stored row is read first.
function primePost(post: PostRow) {
  primeDatabaseSnapshot(
    `post:${post.lang}:${post.id}:${post.categorySlug}:${post.slug}`,
    post,
  )
}

async function storedPost(id: string): Promise<PostRow | undefined> {
  const rows = await db
    .select()
    .from(posts)
    .where(and(eq(posts.id, id), eq(posts.lang, getLocale())))
    .limit(1)
  return rows[0]
}

export function openNote(
  router: Router,
  note: NoteRow,
  prepareSharedHero?: () => void,
) {
  const webUrl = siteHref(`/notes/${note.nid}`)
  if (note.hasPassword || markdownOpensOnWeb(note.contentFormat)) {
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
  if (
    (note.contentFormat === 'lexical' && note.content) ||
    note.contentFormat === 'markdown'
  ) {
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
  if (markdownOpensOnWeb(post.contentFormat)) {
    void openExternalUrl(webUrl)
    return
  }
  const href = {
    pathname: '/posts/[category]/[slug]',
    params: { category: post.categorySlug, postId: post.id, slug: post.slug },
  } as const
  if (isFullPostRow(post)) {
    primePost(post)
    router.push(href)
    return
  }
  void storedPost(post.id)
    .then((row) => {
      if (row) primePost(row)
    })
    .catch(() => {})
    .finally(() => router.push(href))
}
