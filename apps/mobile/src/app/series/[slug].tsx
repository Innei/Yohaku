import { useLocalSearchParams } from 'expo-router'

import { TopicDetailScreen } from '@/screens/topics/topic-detail'

export default function SeriesDetailRoute() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  return <TopicDetailScreen slug={slug} />
}
