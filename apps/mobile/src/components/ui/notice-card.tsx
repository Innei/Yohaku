import { radius } from '@yohaku/design-system/tokens'
import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'

import { usePalette } from '@/theme/palette'
import { shadow } from '@/theme/surfaces'

import { noticeCardHasWash } from './notice-card-theme'

// Light-only: amber wash on parchment. Dark is plain paper — warmth at low
// luminance reads olive, so dark does not carry the light recipe.
const wash =
  'linear-gradient(135deg, rgba(197,100,115,0.05) 0%, rgba(255,228,180,0.07) 52%, rgba(197,100,115,0.025) 100%)'

const bloom =
  'radial-gradient(circle 150px at 88% -8%, rgba(255,228,180,0.16), rgba(255,228,180,0) 70%)'

export const NOTICE_ICON_COL = 22

export interface NoticeCardRow {
  key: string
  node: ReactNode
}

export function NoticeCard({ rows }: { rows: NoticeCardRow[] }) {
  const palette = usePalette()
  if (rows.length === 0) return null

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: palette.surface.paper,
          boxShadow: shadow.paper[palette.theme],
        },
      ]}
    >
      {noticeCardHasWash(palette.theme) ? (
        <>
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { experimental_backgroundImage: wash },
            ]}
          />
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { experimental_backgroundImage: bloom },
            ]}
          />
        </>
      ) : null}
      {rows.map((row, index) => (
        <View key={row.key}>
          {index > 0 ? (
            <View
              style={[styles.hairline, { backgroundColor: palette.neutral[4] }]}
            />
          ) : null}
          <View style={styles.row}>{row.node}</View>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.paper,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  row: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 7,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    opacity: 0.6,
  },
})
