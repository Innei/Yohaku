import { type as typeScale } from '@yohaku/design-system/tokens'
import type { StyleProp, TextStyle } from 'react-native'
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native'

import { AppText, RemoteImage } from '@/components/ui'
import type { FontStyle } from '@/theme/font-faces'
import { clampFontScale } from '@/theme/font-scale'
import { fonts } from '@/theme/fonts'
import { noteTypography } from '@/theme/note-typography'
import { usePalette } from '@/theme/palette'
import { useNativeSerifFontStyle } from '@/theme/serif-font'

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
  serifFont,
}: {
  accent: string
  ink: string
  inline: PreviewInline
  serifFont: FontStyle
}) {
  const fontScale = clampFontScale(useWindowDimensions().fontScale)
  if (inline.break) return '\n'
  return (
    <Text
      allowFontScaling={false}
      style={{
        ...(inline.code ? fonts.mono : serifFont),
        ...(inline.italic ? { fontStyle: 'italic' as const } : null),
        ...(inline.strike
          ? { textDecorationLine: 'line-through' as const }
          : null),
        ...(inline.underline
          ? { textDecorationLine: 'underline' as const }
          : null),
        ...(inline.code
          ? { fontSize: typeScale.copy14.size * fontScale }
          : null),
        color: inline.href ? accent : ink,
      }}
    >
      {inline.text}
    </Text>
  )
}

function InlineText({
  inlines,
  serifFont,
  style,
}: {
  inlines: PreviewInline[]
  serifFont: FontStyle
  style: StyleProp<TextStyle>
}) {
  const palette = usePalette()
  return (
    <AppText style={style}>
      {inlines.map((inline, index) => (
        <InlineRun
          accent={palette.accent}
          ink={palette.neutral[9]}
          inline={inline}
          key={inlineKey(inline, index)}
          serifFont={serifFont}
        />
      ))}
    </AppText>
  )
}

function Block({
  block,
  serifFont,
}: {
  block: PreviewBlock
  serifFont: FontStyle
}) {
  const palette = usePalette()
  const body = {
    ...serifFont,
    color: palette.neutral[9],
    fontSize: noteTypography.fontSize,
    lineHeight: noteTypography.lineHeight,
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
        serifFont={serifFont}
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
          serifFont={serifFont}
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
            <AppText style={[body, styles.marker, { color: palette.neutral[6] }]}>
              {block.ordered ? `${index + 1}.` : '·'}
            </AppText>
            <View style={styles.listBody}>
              <InlineText
                inlines={item}
                serifFont={serifFont}
                style={body}
              />
            </View>
          </View>
        ))}
      </View>
    )
  }

  return (
    <InlineText inlines={block.inlines} serifFont={serifFont} style={body} />
  )
}

export function NotePreview({ blocks }: { blocks: PreviewBlock[] }) {
  const serifFont = useNativeSerifFontStyle()
  if (blocks.length === 0) return null
  return (
    <View style={styles.blocks}>
      {blocks.map((block, index) => (
        <Block
          block={block}
          key={blockKey(block, index)}
          serifFont={serifFont}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  blocks: {
    gap: noteTypography.paragraphGap,
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
