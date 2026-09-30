import { useRef, useState } from 'react'
import {
  Animated,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'

import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'
import { useNativeSerifFontStyle } from '@/theme/serif-font'

import { type InlineRun, runsToPlainText } from '../inline-runs'
import { useRichDocument } from '../lexical/context'
import {
  isNumericCell,
  tableColumnWidths,
  tableOverflow,
  tableSignature,
} from './table-layout'
import { type BlockProps } from './types'

interface Cell {
  header: boolean
  runs: InlineRun[]
}

function CellText({ cell, numeric }: { cell: Cell; numeric: boolean }) {
  const palette = usePalette()
  const serif = useNativeSerifFontStyle()
  return (
    <Text
      style={
        cell.header
          ? [
              styles.header,
              { color: palette.neutral[6] },
              numeric && styles.end,
            ]
          : [
              styles.text,
              serif,
              { color: palette.neutral[9] },
              numeric && [styles.numeric, fonts.mono],
            ]
      }
    >
      {cell.runs.map((run, runIndex) => (
        <Text
          key={runIndex}
          style={[
            run.bold && styles.bold,
            run.mention && styles.mention,
            run.italic && styles.italic,
            run.code && [styles.code, fonts.mono],
            run.href || run.tag ? { color: palette.accent } : null,
          ]}
        >
          {run.text}
        </Text>
      ))}
    </Text>
  )
}

function MeasureLayer({
  numeric,
  rows,
  onMeasured,
}: {
  numeric: boolean[]
  onMeasured: (natural: number[]) => void
  rows: Cell[][]
}) {
  const widthsRef = useRef(new Map<string, number>())
  const total = rows.reduce((count, row) => count + row.length, 0)
  const report = (row: number, column: number, width: number) => {
    widthsRef.current.set(`${row}:${column}`, width)
    if (widthsRef.current.size < total) return
    const natural: number[] = []
    for (const [key, value] of widthsRef.current) {
      const index = Number(key.split(':')[1])
      natural[index] = Math.max(natural[index] ?? 0, Math.ceil(value) + 1)
    }
    onMeasured(Array.from(natural, (value) => value ?? 0))
  }
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={styles.measureClip}
    >
      <View style={styles.measureLayer}>
        {rows.flatMap((row, rowIndex) =>
          row.map((cell, cellIndex) => (
            <View
              key={`${rowIndex}:${cellIndex}`}
              style={styles.cell}
              onLayout={(event) =>
                report(rowIndex, cellIndex, event.nativeEvent.layout.width)
              }
            >
              <CellText cell={cell} numeric={numeric[cellIndex] ?? false} />
            </View>
          )),
        )}
      </View>
    </View>
  )
}

function numericColumns(rows: Cell[][]): boolean[] {
  const columns = Math.max(0, ...rows.map((row) => row.length))
  return Array.from({ length: columns }, (_, index) => {
    const body = rows
      .map((row) => row[index])
      .filter((cell): cell is Cell => Boolean(cell && !cell.header))
    return (
      body.length > 0 &&
      body.every((cell) => isNumericCell(runsToPlainText(cell.runs)))
    )
  })
}

function Table({ bleed, rows }: { bleed: number; rows: Cell[][] }) {
  const palette = usePalette()
  const [available, setAvailable] = useState(0)
  const [natural, setNatural] = useState<number[] | null>(null)
  const [scrollX] = useState(() => new Animated.Value(0))
  const numeric = numericColumns(rows)
  const widths =
    natural && available > 0 ? tableColumnWidths(natural, available) : null
  const overflow = widths ? tableOverflow(widths, available) : 0

  return (
    <View
      style={styles.wrap}
      onLayout={(event) => setAvailable(event.nativeEvent.layout.width)}
    >
      {natural ? null : (
        <MeasureLayer numeric={numeric} rows={rows} onMeasured={setNatural} />
      )}
      <Animated.ScrollView
        horizontal
        contentContainerStyle={{ paddingHorizontal: bleed }}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        style={[{ marginHorizontal: -bleed }, !widths && styles.pending]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true },
        )}
      >
        <View>
          {rows.map((row, rowIndex) => {
            const header = row.some((cell) => cell.header)
            const last = rowIndex === rows.length - 1
            return (
              <View
                key={rowIndex}
                style={[
                  styles.row,
                  rowIndex === 0 && {
                    borderTopColor: palette.neutral[8],
                    borderTopWidth: 1,
                  },
                  {
                    borderBottomColor: last
                      ? palette.neutral[8]
                      : header
                        ? palette.neutral[4]
                        : palette.neutral[3],
                    borderBottomWidth:
                      last || header ? 1 : StyleSheet.hairlineWidth,
                  },
                ]}
              >
                {row.map((cell, cellIndex) => {
                  const content = (
                    <CellText
                      cell={cell}
                      numeric={numeric[cellIndex] ?? false}
                    />
                  )
                  const style = [styles.cell, { width: widths?.[cellIndex] }]
                  // The first column rides the scroll offset so row labels stay in view.
                  return cellIndex === 0 && overflow > 0 ? (
                    <Animated.View
                      key={cellIndex}
                      style={[
                        style,
                        styles.sticky,
                        {
                          backgroundColor: palette.surface.desk,
                          transform: [
                            {
                              translateX: scrollX.interpolate({
                                extrapolate: 'clamp',
                                inputRange: [0, overflow],
                                outputRange: [0, overflow],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      {content}
                    </Animated.View>
                  ) : (
                    <View key={cellIndex} style={style}>
                      {content}
                    </View>
                  )
                })}
              </View>
            )
          })}
        </View>
      </Animated.ScrollView>
      {overflow > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.fade,
            {
              experimental_backgroundImage: `linear-gradient(to right, ${palette.surface.desk}00, ${palette.surface.desk})`,
              opacity: scrollX.interpolate({
                extrapolate: 'clamp',
                inputRange: [Math.max(0, overflow - 24), overflow],
                outputRange: [1, 0],
              }),
              right: -bleed,
            },
          ]}
        />
      ) : null}
    </View>
  )
}

export function TableBlock({ node }: BlockProps) {
  const doc = useRichDocument()
  const { fontScale } = useWindowDimensions()
  const rows = (node.rows as Cell[][] | undefined) ?? []
  if (rows.length === 0) return null
  return (
    <Table
      bleed={doc.bleed}
      key={`${fontScale}:${tableSignature(rows)}`}
      rows={rows}
    />
  )
}

const styles = StyleSheet.create({
  wrap: { marginVertical: 12 },
  pending: { opacity: 0 },
  row: { flexDirection: 'row' },
  cell: { paddingHorizontal: 10, paddingVertical: 9 },
  sticky: { zIndex: 1 },
  fade: { bottom: 0, position: 'absolute', top: 0, width: 36 },
  measureClip: { height: 0, overflow: 'hidden' },
  measureLayer: { alignItems: 'flex-start', position: 'absolute', width: 10000 },
  header: { fontSize: 12, fontWeight: '600', lineHeight: 18 },
  text: { fontSize: 15, lineHeight: 22 },
  numeric: { fontSize: 13, fontVariant: ['tabular-nums'], textAlign: 'right' },
  end: { textAlign: 'right' },
  bold: { fontWeight: '600' },
  mention: { fontWeight: '500' },
  italic: { fontStyle: 'italic' },
  code: { fontSize: 13 },
})
