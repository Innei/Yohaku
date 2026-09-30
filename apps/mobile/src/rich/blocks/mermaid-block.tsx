import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { AppText, RemoteImage } from '@/components/ui'
import {
  type InsightsMermaidRender,
  renderInsightsMermaid,
} from '@/lib/insights-mermaid'
import { usePalette } from '@/theme/palette'

import { DiagramPlate } from './diagram-plate'
import { useBoneColor } from './skeleton'
import { type BlockProps, str } from './types'

export function MermaidBlock({ node }: BlockProps) {
  const palette = usePalette()
  const bone = useBoneColor()
  const diagram = str(node.diagram)
  const [rendered, setRendered] = useState<InsightsMermaidRender | null>(null)

  useEffect(() => {
    let cancelled = false
    void renderInsightsMermaid(diagram, {
      bg: palette.neutral[1],
      fg: palette.neutral[9],
    }).then((next) => {
      if (!cancelled) setRendered(next)
    })
    return () => {
      cancelled = true
    }
  }, [diagram, palette.neutral])

  if (!rendered?.src) {
    if (!rendered?.error) {
      return <View style={[styles.placeholder, { backgroundColor: bone }]} />
    }
    return (
      <AppText color={palette.neutral[7]} variant="secondary">
        {rendered.error}
      </AppText>
    )
  }
  const ratio =
    rendered.width && rendered.height ? rendered.width / rendered.height : 2
  return (
    <DiagramPlate label="mermaid">
      <RemoteImage
        contentFit="contain"
        images={[rendered.src]}
        index={0}
        style={{ aspectRatio: ratio, width: '100%' }}
        uri={rendered.src}
      />
    </DiagramPlate>
  )
}

const styles = StyleSheet.create({
  placeholder: { borderRadius: 12, height: 120, marginVertical: 12 },
})
