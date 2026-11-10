import { useCallback, useMemo, useRef } from 'react'
import type {
  NativeSyntheticEvent,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native'
import { StyleSheet, Text, View } from 'react-native'

import type {
  InlineRun,
  RichTextBlock,
  RichTextHighlight,
  RichTextMenuItem,
} from '@/rich/inline-runs'

interface Typography {
  accentColor: string
  codeBackground: string
  codeFontFamily: string
  color: string
  fallbackFontFamily?: string
  fontFamily?: string
  fontSize: number
  headings: Record<
    string,
    {
      color: string
      fontFamily?: string
      lineHeight: number
      size: number
      spacingAfter: number
      spacingBefore: number
      weight: 'regular' | 'semibold'
    }
  >
  highlightColor: string
  hrGap: number
  lineHeight: number
  linkColor: string
  list: { indent: number; itemGap: number; markerInset: number; textInset: number }
  mutedColor: string
  paperColor: string
  paragraphGap: number
  quote: {
    barColor: string
    fontSize: number
    gap: number
    indent: number
    italic: boolean
    lineHeight: number
    color: string
    fontFamily?: string
  }
  secondaryColor: string
}

interface RichTextProps {
  blocks: RichTextBlock[]
  highlights?: RichTextHighlight[]
  menuItems?: RichTextMenuItem[]
  onBlockRects?: (
    event: NativeSyntheticEvent<{
      rects: Array<{ height: number; id: string; y: number }>
    }>,
  ) => void
  onContentHeight?: (event: NativeSyntheticEvent<{ height: number }>) => void
  onHighlightPress?: (event: NativeSyntheticEvent<{ id: string }>) => void
  onLinkPress?: (event: NativeSyntheticEvent<{ href: string }>) => void
  onMenuAction?: (
    event: NativeSyntheticEvent<{
      end: { blockId: string; offset: number }
      id: string
      start: { blockId: string; offset: number }
      text: string
    }>,
  ) => void
  onSelectionActive?: (event: NativeSyntheticEvent<{ active: boolean }>) => void
  style?: StyleProp<ViewStyle>
  typography: Typography
}

type StyledSpan = {
  end: number
  highlightId?: string
  highlightKind?: string
  run: InlineRun
  start: number
}

/** Split inline runs at highlight boundaries while preserving run styling. */
function spansOf(
  block: RichTextBlock,
  highlights: RichTextHighlight[],
): StyledSpan[] {
  const ranges = highlights
    .filter((highlight) => highlight.blockId === block.id)
    .sort((a, b) => a.start - b.start)
  const spans: StyledSpan[] = []
  let offset = 0
  for (const run of block.runs) {
    const text = run.text ?? ''
    const start = offset
    const end = offset + text.length
    offset = end
    const cuts = new Set<number>([start, end])
    for (const range of ranges) {
      if (range.end <= start || range.start >= end) continue
      cuts.add(Math.max(start, range.start))
      cuts.add(Math.min(end, range.end))
    }
    const sorted = [...cuts].sort((a, b) => a - b)
    for (let index = 0; index < sorted.length - 1; index += 1) {
      const from = sorted[index]!
      const to = sorted[index + 1]!
      if (to <= from) continue
      const covering = ranges.find(
        (range) => range.start <= from && range.end >= to,
      )
      spans.push({
        end: to,
        highlightId: covering?.id,
        highlightKind: covering?.kind,
        run: {
          ...run,
          text: text.slice(from - start, to - start),
        },
        start: from,
      })
    }
  }
  return spans
}

function runStyle(
  run: InlineRun,
  typography: Typography,
  highlightKind: string | undefined,
): TextStyle {
  const style: Record<string, unknown> = {}
  if (run.bold) style.fontWeight = '600'
  if (run.italic) style.fontStyle = 'italic'
  if (run.strike && run.underline) style.textDecorationLine = 'underline line-through'
  else if (run.strike) style.textDecorationLine = 'line-through'
  else if (run.underline) style.textDecorationLine = 'underline'
  if (run.code) {
    style.fontFamily = typography.codeFontFamily
    style.fontSize = Math.round(typography.fontSize * 0.88)
    style.backgroundColor = typography.codeBackground
  }
  if (run.math) {
    style.fontStyle = 'italic'
    style.fontFamily = typography.fallbackFontFamily
  }
  if (run.color) style.color = run.color
  if (run.href) style.color = typography.linkColor
  if (run.mention || run.tag) style.color = typography.accentColor
  if (run.sup || run.footnote) {
    style.fontSize = Math.round(typography.fontSize * 0.72)
    style.lineHeight = Math.round(typography.fontSize * 0.9)
  }
  if (run.sub) {
    style.fontSize = Math.round(typography.fontSize * 0.72)
    style.lineHeight = Math.round(typography.fontSize * 0.9)
  }
  if (run.highlight) style.backgroundColor = typography.highlightColor
  if (run.spoiler) {
    style.backgroundColor = typography.color
    style.color = typography.color
  }
  switch (highlightKind) {
    case 'active':
    case 'block-active': {
      style.backgroundColor = `${typography.accentColor}33`
      break
    }
    case 'comment': {
      style.backgroundColor = `${typography.accentColor}22`
      break
    }
    case 'reading': {
      style.backgroundColor = `${typography.accentColor}14`
      break
    }
    case 'block': {
      style.backgroundColor = `${typography.accentColor}1a`
      break
    }
  }
  if (run.ruby) style.textDecorationLine = 'underline'
  return style as TextStyle
}

const LIST_MARKERS = { bullet: '•', check: '☐', number: '' } as const

export function RichTextView({
  blocks,
  highlights = [],
  onBlockRects,
  onContentHeight,
  onHighlightPress,
  onLinkPress,
  style,
  typography,
}: RichTextProps) {
  const rects = useRef<Array<{ height: number; id: string; y: number }>>([])
  const reported = useRef('')
  const reportedHeight = useRef(0)

  const emitRects = useCallback(() => {
    const signature = rects.current.map((rect) => `${rect.id}:${rect.y}`).join('|')
    if (signature === reported.current) return
    reported.current = signature
    onBlockRects?.({
      nativeEvent: { rects: [...rects.current] },
    } as NativeSyntheticEvent<{
      rects: Array<{ height: number; id: string; y: number }>
    }>)
  }, [onBlockRects])

  const renderSpans = (block: RichTextBlock) =>
    spansOf(block, highlights).map((span, index) => {
      const { run } = span
      const base = runStyle(run, typography, span.highlightKind)
      if (run.lineBreak) return <Text key={index}>{'\n'}</Text>
      const text = run.spoiler && !run.text.trim() ? ' ' : run.text
      const onPress = run.href
        ? () =>
            onLinkPress?.({
              nativeEvent: { href: run.href! },
            } as NativeSyntheticEvent<{ href: string }>)
        : span.highlightId
          ? () =>
              onHighlightPress?.({
                nativeEvent: { id: span.highlightId! },
              } as NativeSyntheticEvent<{ id: string }>)
          : undefined
      if (run.ruby) {
        return (
          <Text key={index} onPress={onPress} style={base}>
            {text}
            <Text style={{ fontSize: typography.fontSize * 0.55, lineHeight: typography.fontSize }}>
              {run.ruby}
            </Text>
          </Text>
        )
      }
      return (
        <Text key={index} onPress={onPress} style={base}>
          {text}
        </Text>
      )
    })

  const blocksView = useMemo(
    () =>
      blocks.map((block) => {
        const base: TextStyle = {
          color: typography.color,
          fontFamily: typography.fontFamily,
          fontSize: typography.fontSize,
          lineHeight: typography.lineHeight,
        }
        const onLayout = (event: { nativeEvent: { layout: { height: number; y: number } } }) => {
          const { height, y } = event.nativeEvent.layout
          const existing = rects.current.find((rect) => rect.id === block.id)
          if (existing) {
            existing.y = y
            existing.height = height
          } else {
            rects.current.push({ height, id: block.id, y })
          }
          emitRects()
        }

        if (block.role === 'hr') {
          return (
            <View
              key={block.id}
              onLayout={onLayout}
              style={{
                backgroundColor: typography.secondaryColor,
                height: StyleSheet.hairlineWidth,
                marginVertical: typography.hrGap / 2,
                opacity: 0.5,
              }}
            />
          )
        }

        if (block.role === 'heading') {
          const level = String(block.level ?? 1)
          const spec = typography.headings[level] ?? typography.headings['1']!
          return (
            <View
              key={block.id}
              nativeID={block.id}
              onLayout={onLayout}
              style={{
                marginBottom: spec.spacingAfter,
                marginTop: spec.spacingBefore,
              }}
            >
              <Text
                selectable
                style={{
                  color: spec.color,
                  fontFamily: spec.fontFamily ?? typography.fontFamily,
                  fontSize: spec.size,
                  fontWeight: spec.weight === 'semibold' ? '600' : '400',
                  lineHeight: spec.lineHeight,
                }}
              >
                {renderSpans(block)}
              </Text>
            </View>
          )
        }

        if (block.role === 'quote') {
          return (
            <View
              key={block.id}
              nativeID={block.id}
              onLayout={onLayout}
              style={[
                styles.quote,
                {
                  borderLeftColor: typography.quote.barColor,
                  marginBottom: typography.quote.gap,
                  marginTop: typography.quote.gap,
                  paddingLeft: typography.quote.indent,
                },
              ]}
            >
              <Text
                selectable
                style={{
                  ...base,
                  color: typography.quote.color,
                  fontFamily: typography.quote.fontFamily ?? typography.fontFamily,
                  fontSize: typography.quote.fontSize,
                  lineHeight: typography.quote.lineHeight,
                }}
              >
                {renderSpans(block)}
              </Text>
            </View>
          )
        }

        if (block.role === 'listItem') {
          const depth = block.depth ?? 0
          const list = typography.list
          const marker =
            block.listType === 'check'
              ? block.checked
                ? '☑'
                : '☐'
              : block.listType === 'number'
                ? `${block.index ?? 1}.`
                : LIST_MARKERS.bullet
          return (
            <View
              key={block.id}
              nativeID={block.id}
              onLayout={onLayout}
              style={{
                flexDirection: 'row',
                marginBottom: list.itemGap,
                paddingLeft: depth * list.indent,
              }}
            >
              <Text
                style={{
                  color: block.checked === true ? typography.accentColor : typography.mutedColor,
                  fontSize: block.listType === 'check' ? typography.fontSize * 1.05 : typography.fontSize,
                  lineHeight: typography.lineHeight,
                  textAlign: 'center',
                  width: list.textInset - 4,
                }}
              >
                {marker}
              </Text>
              <Text selectable style={[base, { flex: 1 }]}>
                {renderSpans(block)}
              </Text>
            </View>
          )
        }

        return (
          <View
            key={block.id}
            nativeID={block.id}
            onLayout={onLayout}
            style={{ marginBottom: typography.paragraphGap }}
          >
            <Text selectable style={base}>
              {renderSpans(block)}
            </Text>
          </View>
        )
      }),
    [blocks, highlights, typography, emitRects, onHighlightPress, onLinkPress],
  )

  return (
    <View style={style}>
      {/* The parent pins this view's height to the reported measurement, so the
          intrinsic height has to be measured on an unconstrained inner view. */}
      <View
        onLayout={(event) => {
          const next = Math.ceil(event.nativeEvent.layout.height)
          if (next === reportedHeight.current) return
          reportedHeight.current = next
          onContentHeight?.({
            nativeEvent: { height: next },
          } as NativeSyntheticEvent<{ height: number }>)
        }}
      >
        {blocksView}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  quote: {
    borderLeftWidth: 3,
  },
})
