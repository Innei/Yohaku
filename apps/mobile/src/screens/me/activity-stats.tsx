import { radius, type as typeScale } from '@yohaku/design-system/tokens'
import { useRouter } from 'expo-router'
import { Fragment } from 'react'
import type { TextStyle } from 'react-native'
import { StyleSheet, View } from 'react-native'

import { AppText, NativePressable, SlotText } from '@/components/ui'
import { useTranslations } from '@/i18n'
import { fonts } from '@/theme/fonts'
import type { Palette } from '@/theme/palette'
import { usePalette } from '@/theme/palette'
import { shadow } from '@/theme/surfaces'

const PERFORATION_DOTS = 5

function Perforation({ palette }: { palette: Palette }) {
  return (
    <View style={styles.perforation}>
      <View
        style={[
          styles.notch,
          styles.notchTop,
          { backgroundColor: palette.surface.desk },
        ]}
      />
      <View style={styles.dotColumn}>
        {Array.from({ length: PERFORATION_DOTS }, (_, index) => (
          <View
            key={index}
            style={[styles.dot, { backgroundColor: palette.neutral[4] }]}
          />
        ))}
      </View>
      <View
        style={[
          styles.notch,
          styles.notchBottom,
          { backgroundColor: palette.surface.desk },
        ]}
      />
    </View>
  )
}

export function ActivityStats({
  commentsCount,
  likedCount,
  readingCount,
  showComments,
}: {
  commentsCount: number
  likedCount: number
  readingCount: number
  showComments: boolean
}) {
  const t = useTranslations('me')
  const palette = usePalette()
  const router = useRouter()
  const countStyle: TextStyle = {
    ...fonts.sansMedium,
    fontSize: typeScale.title24.size,
    lineHeight: typeScale.title24.lineHeight,
    color: palette.neutral[9],
    fontVariant: ['tabular-nums'],
  }

  const tiles = showComments
    ? [
        { count: likedCount, href: '/liked' as const, label: t('liked') },
        {
          count: commentsCount,
          href: '/my-comments' as const,
          label: t('comments'),
        },
        { count: readingCount, href: '/reading' as const, label: t('reading') },
      ]
    : [
        { count: likedCount, href: '/liked' as const, label: t('liked') },
        { count: readingCount, href: '/reading' as const, label: t('reading') },
      ]

  return (
    <View
      style={[
        styles.ticket,
        {
          backgroundColor: palette.surface.paper,
          boxShadow: shadow.paperSmall[palette.theme],
        },
      ]}
    >
      {tiles.map((tile, index) => (
        <Fragment key={tile.href}>
          {index > 0 ? <Perforation palette={palette} /> : null}
          <NativePressable
            style={styles.cell}
            onPress={() => router.push(tile.href)}
          >
            <SlotText textStyle={countStyle} value={tile.count} />
            <AppText
              color={palette.neutral[6]}
              style={styles.cellLabel}
              variant="eyebrow"
            >
              {tile.label}
            </AppText>
          </NativePressable>
        </Fragment>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  ticket: {
    flexDirection: 'row',
    borderRadius: radius.paper,
    borderCurve: 'continuous',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 6,
    gap: 5,
  },
  cellLabel: {
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  perforation: {
    width: 0,
    alignItems: 'center',
    overflow: 'visible',
  },
  dotColumn: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  dot: {
    width: 2,
    height: 2,
    borderRadius: 1,
  },
  notch: {
    position: 'absolute',
    left: -5,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  notchTop: {
    top: -5,
  },
  notchBottom: {
    bottom: -5,
  },
})
