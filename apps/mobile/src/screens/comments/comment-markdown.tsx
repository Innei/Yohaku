import { type as typeScale } from '@yohaku/design-system/tokens'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { RemoteImage } from '@/components/ui'
import { hrefForExternalUrl } from '@/lib/link-router'
import type { InlineSpan } from '@/lib/markdown-lite'
import { parseCommentMarkdown } from '@/lib/markdown-lite'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'

export function CommentMarkdown({ text }: { text: string }) {
  const palette = usePalette()
  const router = useRouter()
  const blocks = useMemo(() => parseCommentMarkdown(text), [text])
  const images = useMemo(
    () => blocks.flatMap((block) => (block.type === 'image' ? block.src : [])),
    [blocks],
  )

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
      {blocks.map((block, blockIndex) =>
        block.type === 'image' ? (
          <RemoteImage
            accessibilityLabel={block.alt}
            contentFit="cover"
            images={images}
            index={Math.max(0, images.indexOf(block.src))}
            key={blockIndex}
            style={[styles.image, { backgroundColor: palette.neutral[3] }]}
            uri={block.src}
          />
        ) : (
          <Text
            key={blockIndex}
            style={{
              ...fonts.sans,
              fontSize: typeScale.copy15.size,
              lineHeight: typeScale.copy15.lineHeight,
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
        ),
      )}
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
