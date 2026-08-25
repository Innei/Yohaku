import { Stack } from 'expo-router'

import { getStackScreenOptions } from '@/components/navigation/stack-screen-options'
import { usePalette } from '@/theme/palette'

export default function StudyLayout() {
  const palette = usePalette()
  return <Stack screenOptions={getStackScreenOptions(palette.surface.desk)} />
}
