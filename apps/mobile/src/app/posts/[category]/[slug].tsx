import { Stack, useLocalSearchParams } from 'expo-router'

import { PostDetailScreen } from '@/screens/details/post-detail'

export default function PostDetailRoute() {
  const { category, slug } = useLocalSearchParams<{
    category: string
    slug: string
  }>()
  return (
    <>
      <Stack.Screen options={{ headerBackVisible: true }} />
      <PostDetailScreen categorySlug={String(category)} slug={String(slug)} />
    </>
  )
}
