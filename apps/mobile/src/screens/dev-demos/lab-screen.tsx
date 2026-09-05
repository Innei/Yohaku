import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { EdgeEffectScrollView } from '@/components/navigation/edge-effect-scroll-view'
import { AppText } from '@/components/ui'
import { usePalette } from '@/theme/palette'

export function LabScreen({
  children,
  intro,
  title,
}: {
  children: ReactNode
  intro: string
  title: string
}) {
  const palette = usePalette()
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.screen, { backgroundColor: palette.surface.desk }]}>
      <EdgeEffectScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 44 },
        ]}
        style={styles.screen}
      >
        <AppText variant="largeTitle">{title}</AppText>
        <AppText variant="secondary">{intro}</AppText>
        {children}
      </EdgeEffectScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
})
