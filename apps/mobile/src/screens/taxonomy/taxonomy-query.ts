import { and, desc, eq, sql } from 'drizzle-orm'

import { db } from '@/db'
import { categories, type CategoryRow, type PostRow, posts } from '@/db/schema'
import type { Locale } from '@/i18n/config'

import { tagJsonContains } from './taxonomy-sql'

export async function readCategoryPosts(
  slug: string,
  lang: Locale,
): Promise<{ category: CategoryRow | undefined; posts: PostRow[] }> {
  const [categoryRows, postRows] = await Promise.all([
    db
      .select()
      .from(categories)
      .where(and(eq(categories.slug, slug), eq(categories.lang, lang)))
      .limit(1),
    db
      .select()
      .from(posts)
      .where(and(eq(posts.categorySlug, slug), eq(posts.lang, lang)))
      .orderBy(desc(sql`${posts.pinAt} is not null`), desc(posts.createdAt)),
  ])
  return { category: categoryRows[0], posts: postRows }
}

export async function readTagPosts(
  name: string,
  lang: Locale,
): Promise<PostRow[]> {
  return db
    .select()
    .from(posts)
    .where(and(eq(posts.lang, lang), tagJsonContains(name)))
    .orderBy(desc(posts.createdAt))
}
