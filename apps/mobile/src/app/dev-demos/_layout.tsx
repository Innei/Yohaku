import { Stack } from 'expo-router'

import { getStackScreenOptions } from '@/components/navigation/stack-screen-options'
import { usePalette } from '@/theme/palette'

export default function DevDemosLayout() {
  const palette = usePalette()
  return (
    <Stack screenOptions={getStackScreenOptions(palette.surface.desk)}>
      <Stack.Screen name="index" options={{ headerBackVisible: true }} />
      <Stack.Screen name="markdown" options={{ headerBackVisible: true }} />
      <Stack.Screen name="print" options={{ headerBackVisible: true }} />
    </Stack>
  )
}
