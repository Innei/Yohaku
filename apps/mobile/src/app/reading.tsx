import { Stack } from 'expo-router'

import { ReadingListScreen } from '@/screens/me/reading-list'

export default function ReadingRoute() {
  return (
    <>
      <Stack.Screen options={{ headerBackVisible: true }} />
      <ReadingListScreen />
    </>
  )
}
