import { type as typeScale } from '@yohaku/design-system/tokens'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import type { ApiEnrichment } from '@/api/types'
import { RemoteImage } from '@/components/ui'
import { hrefForExternalUrl } from '@/lib/link-router'
import type { InlineSpan } from '@/lib/markdown-lite'
import { thinkingBlocks } from '@/lib/thinking-markdown'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'

import { ThinkingLinkCard } from './thinking-link-card'

export function ThinkingBody({
  content,
  enrichments,
}: {
  content: string
  enrichments?: Record<string, ApiEnrichment> | null
}) {
  const palette = usePalette()
  const router = useRouter()
  const blocks = useMemo(
    () => thinkingBlocks(content, enrichments),
    [content, enrichments],
  )
  const images = useMemo(
    () => blocks.flatMap((block) => (block.type === 'image' ? block.src : [])),
    [blocks],
  )

  if (blocks.length === 0) return null

  const openLink = async (href: string) => {
    const internal = hrefForExternalUrl(href)
    if (internal) {
      router.push(internal)
    } else {
      await WebBrowser.openBrowserAsync(href)
    }
  }

  const spanStyle = (span: InlineSpan) => {
    switch (span.type) {
      case 'bold': {
        return { ...fonts.sansMedium }
      }
      case 'italic': {
        return { fontStyle: 'italic' as const }
      }
      case 'code': {
        return {
          ...fonts.mono,
          fontSize: typeScale.copy13.size,
          backgroundColor: palette.neutral[3],
        }
      }
      case 'link': {
        return { color: palette.accent }
      }
      default: {
        return null
      }
    }
  }

  return (
    <View style={styles.blocks}>
      {blocks.map((block, blockIndex) => {
        if (block.type === 'card') {
          return (
            <ThinkingLinkCard enrichment={block.enrichment} key={block.href} />
          )
        }
        if (block.type === 'image') {
          return (
            <RemoteImage
              accessibilityLabel={block.alt}
              contentFit="cover"
              images={images}
              index={Math.max(0, images.indexOf(block.src))}
              key={block.src}
              style={[styles.image, { backgroundColor: palette.neutral[3] }]}
              uri={block.src}
            />
          )
        }
        return (
          <Text
            key={blockIndex}
            style={{
              ...fonts.sans,
              fontSize: typeScale.copy16.size,
              lineHeight: typeScale.copy16.lineHeight,
              color: palette.neutral[9],
            }}
          >
            {block.spans.map((span, spanIndex) =>
              span.type === 'link' ? (
                <Text
                  key={spanIndex}
                  style={spanStyle(span)}
                  onPress={() => void openLink(span.href)}
                >
                  {span.text}
                </Text>
              ) : (
                <Text key={spanIndex} style={spanStyle(span)}>
                  {span.text}
                </Text>
              ),
            )}
          </Text>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  blocks: {
    gap: 8,
  },
  image: {
    borderRadius: 10,
    borderCurve: 'continuous',
    height: 160,
    width: '100%',
  },
})
