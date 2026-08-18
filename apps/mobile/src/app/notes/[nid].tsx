import { Stack, useLocalSearchParams } from 'expo-router'

import { NoteDetailScreen } from '@/screens/details/note-detail'

export default function NoteDetailRoute() {
  const { nid } = useLocalSearchParams<{ nid: string }>()
  return (
    <>
      <Stack.Screen options={{ headerBackVisible: true }} />
      <NoteDetailScreen nid={Number(nid)} />
    </>
  )
}
