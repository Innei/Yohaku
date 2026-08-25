import { Stack, useLocalSearchParams } from 'expo-router'

import { PageDetailScreen } from '@/screens/details/page-detail'

export default function PageDetailRoute() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  return (
    <>
      <Stack.Screen options={{ headerBackVisible: true }} />
      <PageDetailScreen slug={String(slug)} />
    </>
  )
}
