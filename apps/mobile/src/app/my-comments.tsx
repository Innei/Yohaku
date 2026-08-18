import { Stack } from 'expo-router'

import { MyCommentsListScreen } from '@/screens/me/my-comments-list'

export default function MyCommentsRoute() {
  return (
    <>
      <Stack.Screen options={{ headerBackVisible: true }} />
      <MyCommentsListScreen />
    </>
  )
}
