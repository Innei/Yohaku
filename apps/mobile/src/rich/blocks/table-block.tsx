import { ScrollView, StyleSheet, Text, View } from 'react-native'

import { usePalette } from '@/theme/palette'
import { useNativeSerifFontStyle } from '@/theme/serif-font'

import type { InlineRun } from '../inline-runs'
import { type BlockProps } from './types'

interface Cell {
  header: boolean
  runs: InlineRun[]
}

export function TableBlock({ node }: BlockProps) {
  const palette = usePalette()
  const serif = useNativeSerifFontStyle()
  const rows = (node.rows as Cell[][] | undefined) ?? []
  const columns = Math.max(0, ...rows.map((row) => row.length))
  const cellWidth = Math.max(96, Math.min(220, 320 / Math.max(columns, 1)))

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.wrap}
    >
      <View style={[styles.table, { borderColor: palette.neutral[3] }]}>
        {rows.map((row, rowIndex) => (
          <View
            key={rowIndex}
            style={[
              styles.row,
              rowIndex > 0 && {
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: palette.neutral[3],
              },
              row.some((cell) => cell.header) && {
                backgroundColor: palette.neutral[1],
              },
            ]}
          >
            {row.map((cell, cellIndex) => (
              <View
                key={cellIndex}
                style={[
                  styles.cell,
                  { width: cellWidth },
                  cellIndex > 0 && {
                    borderLeftWidth: StyleSheet.hairlineWidth,
                    borderLeftColor: palette.neutral[3],
                  },
                ]}
              >
                <Text
                  style={[styles.text, serif, { color: palette.neutral[9] }]}
                >
                  {cell.runs.map((run, runIndex) => (
                    <Text
                      key={runIndex}
                      style={[
                        (run.bold || cell.header) && styles.bold,
                        run.italic && styles.italic,
                        run.code && styles.code,
                        run.href ? { color: palette.accent } : null,
                      ]}
                    >
                      {run.text}
                    </Text>
                  ))}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  wrap: { marginVertical: 12 },
  table: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 6,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row' },
  cell: { paddingHorizontal: 10, paddingVertical: 8 },
  text: { fontSize: 15, lineHeight: 22 },
  bold: { fontWeight: '600' },
  italic: { fontStyle: 'italic' },
  code: { fontFamily: 'CascadiaCodePL_400Regular', fontSize: 13 },
})
