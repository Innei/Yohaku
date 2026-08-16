import { sql } from 'drizzle-orm'

// List sync must never overwrite locally cached bodies: these sets leave
// text/content/body_version untouched on conflict. content_format is
// meta-owned — the list response carries it as a scalar unaffected by
// truncation, and tap routing needs it before any body fetch.
export const postConflictSet = {
  slug: sql`excluded.slug`,
  title: sql`excluded.title`,
  categoryId: sql`excluded.category_id`,
  categorySlug: sql`excluded.category_slug`,
  categoryName: sql`excluded.category_name`,
  tags: sql`excluded.tags`,
  excerpt: sql`excluded.excerpt`,
  contentFormat: sql`excluded.content_format`,
  readCount: sql`excluded.read_count`,
  likeCount: sql`excluded.like_count`,
  modifiedAt: sql`excluded.modified_at`,
  pinAt: sql`excluded.pin_at`,
}

export const noteConflictSet = {
  nid: sql`excluded.nid`,
  title: sql`excluded.title`,
  mood: sql`excluded.mood`,
  weather: sql`excluded.weather`,
  excerpt: sql`excluded.excerpt`,
  contentFormat: sql`excluded.content_format`,
  hasPassword: sql`excluded.has_password`,
  topicId: sql`excluded.topic_id`,
  readCount: sql`excluded.read_count`,
  likeCount: sql`excluded.like_count`,
  modifiedAt: sql`excluded.modified_at`,
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
