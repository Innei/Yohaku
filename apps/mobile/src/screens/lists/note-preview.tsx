import { type as typeScale } from '@yohaku/design-system/tokens'
import type { StyleProp, TextStyle } from 'react-native'
import { StyleSheet, Text, View } from 'react-native'

import { RemoteImage } from '@/components/ui'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'

import {
  type PreviewBlock,
  type PreviewInline,
} from './note-preview-model'

function inlineKey(inline: PreviewInline, index: number) {
  return `${inline.break ? 'br' : inline.text}:${inline.href ?? ''}:${index}`
}

function blockKey(block: PreviewBlock, index: number) {
  if (block.type === 'image') return `image:${block.src}`
  if (block.type === 'list') {
    return `list:${block.items[0]?.[0]?.text ?? ''}:${index}`
  }
  return `${block.type}:${block.inlines[0]?.text ?? ''}:${index}`
}

function InlineRun({
  inline,
  accent,
  ink,
}: {
  accent: string
  ink: string
  inline: PreviewInline
}) {
  if (inline.break) return '\n'
  return (
    <Text
      style={{
        ...(inline.code ? fonts.mono : fonts.serif),
        ...(inline.italic ? { fontStyle: 'italic' as const } : null),
        ...(inline.strike
          ? { textDecorationLine: 'line-through' as const }
          : null),
        ...(inline.underline
          ? { textDecorationLine: 'underline' as const }
          : null),
        ...(inline.code ? { fontSize: typeScale.copy14.size } : null),
        color: inline.href ? accent : ink,
      }}
    >
      {inline.text}
    </Text>
  )
}

function InlineText({
  inlines,
  style,
}: {
  inlines: PreviewInline[]
  style: StyleProp<TextStyle>
}) {
  const palette = usePalette()
  return (
    <Text style={style}>
      {inlines.map((inline, index) => (
        <InlineRun
          accent={palette.accent}
          ink={palette.neutral[9]}
          inline={inline}
          key={inlineKey(inline, index)}
        />
      ))}
    </Text>
  )
}

function Block({ block }: { block: PreviewBlock }) {
  const palette = usePalette()
  const body = {
    ...fonts.serif,
    color: palette.neutral[9],
    fontSize: 18,
    lineHeight: 28,
  }

  if (block.type === 'image') {
    return (
      <RemoteImage
        accessibilityLabel={block.alt || undefined}
        contentFit="cover"
        style={[styles.image, { backgroundColor: palette.neutral[3] }]}
        uri={block.src}
      />
    )
  }

  if (block.type === 'heading') {
    const scale = block.level <= 2 ? typeScale.title24 : typeScale.title20
    return (
      <InlineText
        inlines={block.inlines}
        style={{
          ...body,
          fontSize: scale.size,
          lineHeight: scale.lineHeight,
        }}
      />
    )
  }

  if (block.type === 'quote') {
    return (
      <View
        style={[styles.quote, { borderLeftColor: palette.semantic.warning }]}
      >
        <InlineText
          inlines={block.inlines}
          style={{ ...body, color: palette.neutral[8] }}
        />
      </View>
    )
  }

  if (block.type === 'list') {
    return (
      <View style={styles.list}>
        {block.items.map((item, index) => (
          <View
            style={styles.listItem}
            key={item
              .map((inline) => inline.text ?? inline.href ?? 'br')
              .join('|')}
          >
            <Text style={[body, styles.marker, { color: palette.neutral[6] }]}>
              {block.ordered ? `${index + 1}.` : '·'}
            </Text>
            <View style={styles.listBody}>
              <InlineText inlines={item} style={body} />
            </View>
          </View>
        ))}
      </View>
    )
  }

  return <InlineText inlines={block.inlines} style={body} />
}

export function NotePreview({ blocks }: { blocks: PreviewBlock[] }) {
  if (blocks.length === 0) return null
  return (
    <View style={styles.blocks}>
      {blocks.map((block, index) => (
        <Block block={block} key={blockKey(block, index)} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  blocks: {
    gap: 16,
  },
  image: {
    borderCurve: 'continuous',
    borderRadius: 12,
    height: 200,
    width: '100%',
  },
  quote: {
    borderLeftWidth: 2,
    paddingLeft: 12,
  },
  list: {
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    gap: 8,
  },
  marker: {
    minWidth: 18,
  },
  listBody: {
    flex: 1,
  },
})
