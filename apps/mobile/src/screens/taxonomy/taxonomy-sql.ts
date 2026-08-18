import { sql } from 'drizzle-orm'

import { posts } from '@/db/schema'

export function tagJsonContains(tag: string) {
  return sql`exists (select 1 from json_each(${posts.tags}) where json_each.value = ${tag})`
}
