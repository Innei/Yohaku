import { useLocalSearchParams } from 'expo-router'

import { TopicDetailScreen } from '@/screens/topics/topic-detail'

export default function SeriesDetailRoute() {
  const { slug, topicId } = useLocalSearchParams<{
    slug: string
    topicId?: string
  }>()
  return <TopicDetailScreen slug={slug} topicId={topicId} />
}
