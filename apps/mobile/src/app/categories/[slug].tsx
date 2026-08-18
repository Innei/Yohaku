import { useLocalSearchParams } from 'expo-router'

import { CategoryDetailScreen } from '@/screens/taxonomy/category-detail'
import { decodeRouteParam } from '@/screens/taxonomy/taxonomy-model'

export default function CategoryRoute() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  return <CategoryDetailScreen slug={decodeRouteParam(slug)} />
}
