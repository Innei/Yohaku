import { Stack } from 'expo-router'

import { LikedListScreen } from '@/screens/me/liked-list'

export default function LikedRoute() {
  return (
    <>
      <Stack.Screen options={{ headerBackVisible: true }} />
      <LikedListScreen />
    </>
  )
}
