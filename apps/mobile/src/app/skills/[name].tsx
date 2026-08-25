import { Stack } from 'expo-router'

import { SkillDetailScreen } from '@/screens/details/skill-detail'

export default function SkillDetailRoute() {
  return (
    <>
      <Stack.Screen options={{ headerBackVisible: true }} />
      <SkillDetailScreen />
    </>
  )
}
