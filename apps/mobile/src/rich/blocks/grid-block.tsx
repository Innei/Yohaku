import { Fragment } from 'react'
import { StyleSheet, useWindowDimensions, View } from 'react-native'

import { AppText } from '@/components/ui'
import { usePalette } from '@/theme/palette'
import { fonts } from '@/theme/fonts'

import { bodyMetrics } from '../body-scale'
import { useRichDocument } from '../lexical/context'
import { gridCells, isMediaGrid } from './grid'
import { type BlockProps, num } from './types'

export function GridBlock({ node }: BlockProps) {
  const palette = usePalette()
  const { fontScale } = useWindowDimensions()
  const doc = useRichDocument()
  const cells = gridCells(node)
  if (cells.length === 0) return null

  if (isMediaGrid(cells)) {
    const cols = Math.max(1, num(node.cols) ?? cells.length)
    const rows: (typeof cells)[] = []
    for (let i = 0; i < cells.length; i += cols)
      rows.push(cells.slice(i, i + cols))
    return (
      <View style={styles.media}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.mediaRow}>
            {Array.from({ length: cols }, (_, index) => (
              <View key={index} style={styles.mediaCell}>
                {row[index] ? doc.renderNested(row[index]) : null}
              </View>
            ))}
          </View>
        ))}
      </View>
    )
  }

  return (
    <View style={styles.stack}>
      {cells.map((cell, index) => (
        <Fragment key={index}>
          {index > 0 ? (
            <View
              style={[styles.divider, { backgroundColor: palette.neutral[3] }]}
            />
          ) : null}
          <View style={styles.entry}>
            <AppText
              color={palette.neutral[5]}
              style={[
                styles.number,
                fonts.mono,
                {
                  lineHeight: bodyMetrics(doc.variant ?? 'article', fontScale)
                    .lineHeight,
                },
              ]}
            >
              {String(index + 1).padStart(2, '0')}
            </AppText>
            <View style={styles.body}>{doc.renderNested(cell)}</View>
          </View>
        </Fragment>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  media: {
    gap: 8,
    marginVertical: 12,
  },
  mediaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  mediaCell: {
    flex: 1,
  },
  stack: {
    marginVertical: 12,
  },
  entry: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 12,
  },
  number: {
    fontSize: 11,
    width: 22,
  },
  body: {
    flex: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 38,
  },
})
