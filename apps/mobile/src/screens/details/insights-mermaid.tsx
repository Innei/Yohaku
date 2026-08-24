import { Image } from 'expo-image'
import { useMemo } from 'react'
import { StyleSheet } from 'react-native'

import { AppText, NativePressable } from '@/components/ui'
import { presentImagePreview } from '@/lib/image-cache'
import { renderInsightsMermaid } from '@/lib/insights-mermaid'
import { usePalette } from '@/theme/palette'

export function InsightsMermaid({ content }: { content: string }) {
  const palette = usePalette()
  const rendered = useMemo(
    () =>
      renderInsightsMermaid(content, {
        bg: palette.surface.desk,
        fg: palette.neutral[9],
      }),
    [content, palette.neutral, palette.surface.desk],
  )

  if (!rendered.src) {
    return (
      <AppText color={palette.neutral[7]} variant="secondary">
        {rendered.error || 'Render failed'}
      </AppText>
    )
  }

  const ratio =
    rendered.width && rendered.height
      ? rendered.width / rendered.height
      : 2

  return (
    <NativePressable
      haptic={false}
      style={styles.hit}
      onPress={() =>
        void presentImagePreview({
          index: 0,
          urls: [rendered.src],
        })
      }
    >
      <Image
        contentFit="contain"
        source={{ uri: rendered.src }}
        style={[styles.image, { aspectRatio: ratio }]}
      />
    </NativePressable>
  )
}

const styles = StyleSheet.create({
  hit: {
    alignSelf: 'stretch',
    marginVertical: 4,
  },
  image: {
    width: '100%',
  },
})
