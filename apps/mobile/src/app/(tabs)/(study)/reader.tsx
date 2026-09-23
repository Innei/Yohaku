import { Stack } from 'expo-router'

import { ReaderScreen } from '@/screens/study/reader-screen'

export default function ReaderRoute() {
  return (
    <>
      <Stack.Screen options={{ headerBackVisible: true }} />
      <ReaderScreen />
    </>
  )
}
