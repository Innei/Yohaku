import { useLocalSearchParams } from 'expo-router'

import { TagDetailScreen } from '@/screens/taxonomy/tag-detail'
import { decodeRouteParam } from '@/screens/taxonomy/taxonomy-model'

export default function TagRoute() {
  const { name } = useLocalSearchParams<{ name: string }>()
  return <TagDetailScreen name={decodeRouteParam(name)} />
}
