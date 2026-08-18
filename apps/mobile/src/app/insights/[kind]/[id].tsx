import { useLocalSearchParams } from 'expo-router'

import { InsightsSheet } from '@/screens/details/insights-sheet'

export default function InsightsRoute() {
  const { id, kind } = useLocalSearchParams<{ id: string; kind: string }>()
  return (
    <InsightsSheet id={String(id)} kind={kind === 'note' ? 'note' : 'post'} />
  )
}
