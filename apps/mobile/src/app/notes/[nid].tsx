import { Stack, useLocalSearchParams } from 'expo-router'

import { NoteDetailScreen } from '@/screens/details/note-detail'

export default function NoteDetailRoute() {
  const { hero, nid } = useLocalSearchParams<{ hero?: string; nid: string }>()
  return (
    <>
      <Stack.Screen options={{ headerBackVisible: true }} />
      <NoteDetailScreen nid={Number(nid)} sharedHero={hero === 'shared'} />
    </>
  )
}
