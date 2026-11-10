import { Stack, useLocalSearchParams } from 'expo-router'
import { Platform } from 'react-native'

import { NoteDetailScreen } from '@/screens/details/note-detail'

export default function NoteDetailRoute() {
  const { hero, nid } = useLocalSearchParams<{ hero?: string; nid: string }>()
  return (
    <>
      <Stack.Screen options={{ headerBackVisible: true }} />
      <NoteDetailScreen
        nid={Number(nid)}
        // Android has no shared-element transition, and the hero band would
        // otherwise reserve a blank title area. Render the regular header.
        sharedHero={Platform.OS === 'ios' && hero === 'shared'}
      />
    </>
  )
}
