import { Stack } from 'expo-router'

import { usePalette } from '@/theme/palette'

export default function DevLayout() {
  const palette = usePalette()
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: palette.surface.desk },
        headerBackButtonDisplayMode: 'minimal',
        headerShadowVisible: false,
        headerShown: false,
        headerTitle: '',
        headerTransparent: true,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="websocket" options={{ headerShown: true }} />
    </Stack>
  )
}
