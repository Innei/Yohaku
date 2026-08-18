import { useRouter } from 'expo-router'

import type { PostRow } from '@/db/schema'

export function pushPost(router: ReturnType<typeof useRouter>, post: PostRow) {
  if (!post.categorySlug) return
  router.push({
    pathname: '/posts/[category]/[slug]',
    params: {
      category: post.categorySlug,
      postId: post.id,
      slug: post.slug,
    },
  })
}
