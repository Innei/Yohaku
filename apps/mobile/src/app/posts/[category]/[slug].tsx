import { Stack, useLocalSearchParams } from 'expo-router'

import { PostDetailScreen } from '@/screens/details/post-detail'

export default function PostDetailRoute() {
  const { category, slug, postId } = useLocalSearchParams<{
    category: string
    postId?: string
    slug: string
  }>()
  return (
    <>
      <Stack.Screen options={{ headerBackVisible: true }} />
      <PostDetailScreen
        categorySlug={String(category)}
        postId={postId}
        slug={String(slug)}
      />
    </>
  )
}
