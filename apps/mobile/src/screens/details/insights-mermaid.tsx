import { Image } from 'expo-image'
import { useEffect, useState } from 'react'
import { StyleSheet } from 'react-native'

import { AppText, NativePressable } from '@/components/ui'
import { presentImagePreview } from '@/lib/image-cache'
import {
  type InsightsMermaidRender,
  renderInsightsMermaid,
} from '@/lib/insights-mermaid'
import { usePalette } from '@/theme/palette'

export function InsightsMermaid({ content }: { content: string }) {
  const palette = usePalette()
  const [rendered, setRendered] = useState<InsightsMermaidRender | null>(null)

  useEffect(() => {
    let cancelled = false
    void renderInsightsMermaid(content, {
      bg: palette.surface.desk,
      fg: palette.neutral[9],
    }).then((next) => {
      if (!cancelled) setRendered(next)
    })
    return () => {
      cancelled = true
    }
  }, [content, palette.neutral, palette.surface.desk])

  if (!rendered?.src) {
    if (!rendered?.error) return null
    return (
      <AppText color={palette.neutral[7]} variant="secondary">
        {rendered.error}
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
