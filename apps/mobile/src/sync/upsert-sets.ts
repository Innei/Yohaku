import { sql } from 'drizzle-orm'

// List sync must never overwrite locally cached bodies: these sets leave
// text/content/body_version untouched on conflict. Sparse list fields
// coalesce so a missing/null incoming value cannot invent a default over
// a richer cached row.
export const postConflictSet = {
  slug: sql`excluded.slug`,
  title: sql`excluded.title`,
  categoryId: sql`coalesce(excluded.category_id, category_id)`,
  categorySlug: sql`coalesce(excluded.category_slug, category_slug)`,
  categoryName: sql`coalesce(excluded.category_name, category_name)`,
  tags: sql`coalesce(excluded.tags, tags)`,
  excerpt: sql`coalesce(excluded.excerpt, excerpt)`,
  contentFormat: sql`coalesce(excluded.content_format, content_format)`,
  readCount: sql`excluded.read_count`,
  likeCount: sql`excluded.like_count`,
  modifiedAt: sql`excluded.modified_at`,
  pinAt: sql`excluded.pin_at`,
}

export const postBodyConflictSet = {
  ...postConflictSet,
  text: sql`excluded.text`,
  content: sql`excluded.content`,
  bodyVersion: sql`excluded.body_version`,
  enrichments: sql`excluded.enrichments`,
  articleMeta: sql`excluded.article_meta`,
}

export const noteConflictSet = {
  nid: sql`excluded.nid`,
  title: sql`excluded.title`,
  mood: sql`coalesce(excluded.mood, mood)`,
  weather: sql`coalesce(excluded.weather, weather)`,
  excerpt: sql`coalesce(excluded.excerpt, excerpt)`,
  contentFormat: sql`coalesce(excluded.content_format, content_format)`,
  hasPassword: sql`coalesce(excluded.has_password, has_password)`,
  topicId: sql`coalesce(excluded.topic_id, topic_id)`,
  coverUrl: sql`excluded.cover_url`,
  coverThumbhash: sql`coalesce(excluded.cover_thumbhash, cover_thumbhash)`,
  readCount: sql`excluded.read_count`,
  likeCount: sql`excluded.like_count`,
  modifiedAt: sql`excluded.modified_at`,
}

export const noteBodyConflictSet = {
  ...noteConflictSet,
  text: sql`excluded.text`,
  content: sql`excluded.content`,
  bodyVersion: sql`excluded.body_version`,
  enrichments: sql`excluded.enrichments`,
  articleMeta: sql`excluded.article_meta`,
}

export const thinkingConflictSet = {
  content: sql`excluded.content`,
  up: sql`excluded.up`,
  down: sql`excluded.down`,
  commentsIndex: sql`excluded.comments_index`,
  allowComment: sql`excluded.allow_comment`,
  modifiedAt: sql`excluded.modified_at`,
  enrichments: sql`excluded.enrichments`,
}

export const topicConflictSet = {
  name: sql`excluded.name`,
  slug: sql`excluded.slug`,
  description: sql`excluded.description`,
  introduce: sql`excluded.introduce`,
  icon: sql`excluded.icon`,
}

export const categoryConflictSet = {
  name: sql`excluded.name`,
  slug: sql`excluded.slug`,
  type: sql`excluded.type`,
}
