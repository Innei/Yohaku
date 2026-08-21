import { type as typeScale } from '@yohaku/design-system/tokens'
import { memo } from 'react'
import { StyleSheet, View } from 'react-native'

import { AppText, NativePressable } from '@/components/ui'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'

import type {
  SearchTimelineEntry,
  SearchTimelineYear,
} from './group-timeline'

export function SearchTimeline({
  years,
  yearCountLabel,
  onPressItem,
}: {
  onPressItem: (item: SearchTimelineEntry) => void
  yearCountLabel: (count: number) => string
  years: SearchTimelineYear[]
}) {
  const ink = usePalette().neutral[10]

  if (years.length === 0) return null

  return (
    <View style={styles.root}>
      {years.map((year, yearIndex) => (
        <View
          key={year.year}
          style={yearIndex > 0 ? styles.laterYear : undefined}
        >
          <View style={styles.yearRow}>
            <AppText
              color={fadeInk(ink, '80')}
              style={styles.year}
              variant="largeTitleSans"
            >
              {year.year}
            </AppText>
            <AppText
              color={fadeInk(ink, '4D')}
              style={styles.yearCount}
              variant="meta"
            >
              {yearCountLabel(year.count)}
            </AppText>
          </View>
          {year.months.map((month) => (
            <View key={`${year.year}-${month.month}`}>
              <AppText
                color={fadeInk(ink, '73')}
                style={styles.month}
                variant="eyebrow"
              >
                {month.label}
              </AppText>
              {month.items.map((item) => (
                <SearchTimelineRow
                  ink={ink}
                  item={item}
                  key={item.id}
                  onPress={onPressItem}
                />
              ))}
            </View>
          ))}
        </View>
      ))}
    </View>
  )
}

const SearchTimelineRow = memo(function SearchTimelineRow({
  ink,
  item,
  onPress,
}: {
  ink: string
  item: SearchTimelineEntry
  onPress: (item: SearchTimelineEntry) => void
}) {
  return (
    <NativePressable
      accessibilityRole="button"
      style={styles.row}
      onPress={() => onPress(item)}
    >
      <AppText color={fadeInk(ink, '73')} style={styles.day} variant="meta">
        {item.day}
      </AppText>
      <AppText
        color={fadeInk(ink, 'E6')}
        numberOfLines={1}
        style={styles.title}
      >
        {item.title}
      </AppText>
      {item.meta ? (
        <AppText
          color={fadeInk(ink, '66')}
          numberOfLines={1}
          style={styles.meta}
          variant="meta"
        >
          {item.meta}
        </AppText>
      ) : null}
    </NativePressable>
  )
})

function fadeInk(hex: string, alpha: string) {
  return `${hex}${alpha}`
}

const styles = StyleSheet.create({
  root: {
    paddingTop: 8,
  },
  laterYear: {
    marginTop: 32,
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 4,
  },
  year: {
    fontFamily: 'ui-rounded',
    fontWeight: '400',
    fontSize: typeScale.display36.size,
    letterSpacing: -1.1,
    lineHeight: typeScale.display36.lineHeight,
    fontVariant: ['tabular-nums'],
  },
  yearCount: {
    fontVariant: ['tabular-nums'],
  },
  month: {
    paddingTop: 14,
    paddingBottom: 6,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    fontVariant: ['tabular-nums'],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 7,
    minHeight: 44,
  },
  day: {
    width: 28,
    fontVariant: ['tabular-nums'],
  },
  title: {
    flex: 1,
    minWidth: 0,
    ...fonts.sansMedium,
    fontSize: typeScale.copy14.size,
    lineHeight: typeScale.copy14.lineHeight,
  },
  meta: {
    flexShrink: 0,
    maxWidth: 96,
  },
})
