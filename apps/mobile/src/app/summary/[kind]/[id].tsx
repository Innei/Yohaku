import { useLocalSearchParams } from 'expo-router'

import { SummarySheet } from '@/screens/details/summary-sheet'

export default function SummaryRoute() {
  const { kind, id } = useLocalSearchParams<{ id: string; kind: string }>()
  return (
    <SummarySheet id={String(id)} kind={kind === 'note' ? 'note' : 'post'} />
  )
}
