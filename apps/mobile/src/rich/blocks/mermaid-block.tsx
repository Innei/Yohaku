import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { AppText, RemoteImage } from '@/components/ui'
import {
  type InsightsMermaidRender,
  renderInsightsMermaid,
} from '@/lib/insights-mermaid'
import { usePalette } from '@/theme/palette'

import { type BlockProps, str } from './types'

export function MermaidBlock({ node }: BlockProps) {
  const palette = usePalette()
  const diagram = str(node.diagram)
  const [rendered, setRendered] = useState<InsightsMermaidRender | null>(null)

  useEffect(() => {
    let cancelled = false
    void renderInsightsMermaid(diagram, {
      bg: palette.surface.desk,
      fg: palette.neutral[9],
    }).then((next) => {
      if (!cancelled) setRendered(next)
    })
    return () => {
      cancelled = true
    }
  }, [diagram, palette.neutral, palette.surface.desk])

  if (!rendered?.src) {
    if (!rendered?.error) return <View style={styles.placeholder} />
    return (
      <AppText color={palette.neutral[7]} variant="secondary">
        {rendered.error}
      </AppText>
    )
  }
  const ratio =
    rendered.width && rendered.height ? rendered.width / rendered.height : 2
  return (
    <RemoteImage
      contentFit="contain"
      images={[rendered.src]}
      index={0}
      style={[styles.image, { aspectRatio: ratio }]}
      uri={rendered.src}
    />
  )
}

const styles = StyleSheet.create({
  placeholder: { height: 120, marginVertical: 12 },
  image: { width: '100%', marginVertical: 12 },
})
