import type { ReactNode } from 'react'
import { useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'

import { SlotText } from '@/components/ui'

import {
  CAROUSEL_GAP,
  CAROUSEL_HEIGHT,
  carouselOffsets,
  carouselPage,
  carouselTileWidths,
} from './media-carousel-layout'

const COUNTER_TEXT = {
  color: '#fdfcf9',
  fontSize: 12,
  lineHeight: 16,
}

export function MediaCarousel({
  bleed,
  items,
  radius,
  renderItem,
}: {
  bleed: number
  items: { height: number; key: string; width: number }[]
  radius: number
  renderItem: (index: number) => ReactNode
}) {
  const [cardWidth, setCardWidth] = useState(0)
  const [page, setPage] = useState(0)
  const widths = carouselTileWidths(items, cardWidth)
  const offsets = carouselOffsets(widths)

  return (
    <View
      style={styles.wrap}
      onLayout={(event) => setCardWidth(event.nativeEvent.layout.width)}
    >
      {cardWidth > 0 ? (
        <ScrollView
          horizontal
          contentContainerStyle={[styles.row, { paddingHorizontal: bleed }]}
          decelerationRate="fast"
          scrollEventThrottle={32}
          showsHorizontalScrollIndicator={false}
          snapToOffsets={offsets}
          style={{ marginHorizontal: -bleed }}
          onScroll={(event) => {
            const { contentOffset, contentSize, layoutMeasurement } =
              event.nativeEvent
            const next = carouselPage(
              offsets,
              contentOffset.x,
              contentSize.width - layoutMeasurement.width,
            )
            if (next !== page) setPage(next)
          }}
        >
          {widths.map((width, index) => (
            <View
              key={items[index]!.key}
              style={[styles.tile, { borderRadius: radius, width }]}
            >
              {renderItem(index)}
            </View>
          ))}
        </ScrollView>
      ) : null}
      <View pointerEvents="none" style={styles.counter}>
        <SlotText textStyle={COUNTER_TEXT} value={page + 1} />
        <Text style={[COUNTER_TEXT, styles.counterTotal]}>/{items.length}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { height: CAROUSEL_HEIGHT },
  row: { gap: CAROUSEL_GAP },
  tile: { height: CAROUSEL_HEIGHT, overflow: 'hidden' },
  counter: {
    backgroundColor: 'rgba(20,19,18,0.62)',
    borderRadius: 999,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 3,
    position: 'absolute',
    right: 8,
    top: 8,
  },
  counterTotal: { fontVariant: ['tabular-nums'] },
})
