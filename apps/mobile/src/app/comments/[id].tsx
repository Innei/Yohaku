import { useLocalSearchParams } from 'expo-router'

import { ThinkingCommentsSheet } from '@/screens/comments/thinking-comments-sheet'

export default function ThinkingCommentsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <ThinkingCommentsSheet refId={String(id)} />
}
