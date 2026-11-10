import type { YohakuNoteHeroSpec } from '@modules/yohaku'
import { YohakuNoteHeroHost, YohakuScrollAttachment } from '@modules/yohaku'
import { isDuo } from '@modules/yohaku/duo-shell'
import { FlashList } from '@shopify/flash-list'
import { useHeaderHeight } from 'expo-router/react-navigation'
import { type ReactNode, useState } from 'react'
import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollViewProps,
  StyleProp,
  ViewStyle,
} from 'react-native'
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { usePalette } from '@/theme/palette'
import { ScrollViewMarkerCompat as ScrollViewMarker } from '@/components/navigation/scroll-view-marker'

import { useInDuoReadable } from '@/components/navigation/duo/readable'
import { pageScrollEdgeEffects } from '@/components/navigation/scroll-edges'

import { listPrefetchWindow } from './list-prefetch-window'

const viewabilityConfig = { minimumViewTime: 0, itemVisiblePercentThreshold: 0 }
const sidePadding = 20
const duoReadableWidth = 560

function useDuoSidePadding() {
  const insets = useSafeAreaInsets()
  const inReadable = useInDuoReadable()
  const [width, setWidth] = useState(0)
  const available = inReadable ? width : width - insets.left - insets.right
  return {
    onLayout: isDuo
      ? (event: { nativeEvent: { layout: { width: number } } }) =>
          setWidth(event.nativeEvent.layout.width)
      : undefined,
    padding: Math.max(sidePadding, (available - duoReadableWidth) / 2),
  }
}

export type YohakuListItem = { id: string; type: string }

export function YohakuList({
  contentInsetBottom = 0,
  contentInsetTop = 8,
  items,
  noteHero,
  noteHeroMetaColor,
  noteHeroTitleColor,
  nativeTopBlur,
  refreshing = false,
  renderItem,
  style,
  topEdgeEffectHidden = false,
  onEndReached,
  onRefresh,
  onScroll,
  onVisibleItems,
}: {
  contentInsetBottom?: number
  contentInsetTop?: number
  items: YohakuListItem[]
  noteHero?: YohakuNoteHeroSpec | null
  noteHeroMetaColor?: string
  noteHeroTitleColor?: string
  nativeTopBlur?: {
    height: number
    readabilityColor: string
    foregroundColor: string
  }
  onEndReached?: () => void
  onRefresh?: () => void
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onVisibleItems?: (items: YohakuListItem[]) => void
  refreshing?: boolean
  renderItem: (item: YohakuListItem) => ReactNode
  style?: StyleProp<ViewStyle>
  topEdgeEffectHidden?: boolean
}) {
  const side = useDuoSidePadding()
  const palette = usePalette()
  const headerHeight = useHeaderHeight()
  const insets = useSafeAreaInsets()
  const statusBarHeight =
    Platform.OS === 'android'
      ? Math.max(insets.top, StatusBar.currentHeight ?? 24)
      : insets.top
  // Android's transparent header does not inset scroll content. Reserve the
  // status bar with a real layout margin (an overlay gets painted under the
  // native list surface) and only the remaining header band as padding.
  const androidTopInset =
    Platform.OS === 'android'
      ? Math.max(0, headerHeight - statusBarHeight) + 8
      : 0
  const list = (
    <FlashList
      contentInset={{ bottom: contentInsetBottom }}
      contentInsetAdjustmentBehavior="automatic"
      data={items}
      getItemType={(item) => item.type}
      keyExtractor={(item) => item.id}
      refreshing={refreshing}
      renderItem={({ item }) => <View>{renderItem(item)}</View>}
      scrollEventThrottle={16}
      scrollIndicatorInsets={{ bottom: contentInsetBottom }}
      style={[styles.fill, style]}
      viewabilityConfig={viewabilityConfig}
      contentContainerStyle={{
        paddingHorizontal: side.padding,
        paddingTop: contentInsetTop + androidTopInset,
        paddingBottom: 24 + (Platform.OS === 'android' ? contentInsetBottom : 0),
      }}
      renderScrollComponent={
        topEdgeEffectHidden ? HiddenTopScrollView : MarkedScrollView
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      onLayout={side.onLayout}
      onRefresh={onRefresh}
      onScroll={onScroll}
      onViewableItemsChanged={({ viewableItems }) =>
        onVisibleItems?.(listPrefetchWindow(items, viewableItems))
      }
    />
  )

  return (
    <View style={styles.fill}>
      <View
        style={[
          styles.fill,
          { marginTop: Platform.OS === 'android' ? statusBarHeight : 0 },
        ]}
      >
        {noteHero ? (
          <YohakuNoteHeroHost
            nativeTopBlurForegroundColor={nativeTopBlur?.foregroundColor}
            nativeTopBlurHeight={nativeTopBlur?.height}
            nativeTopBlurReadabilityColor={nativeTopBlur?.readabilityColor}
            noteHeroContentInsetTop={contentInsetTop}
            noteHeroCoverPlaceholderUri={noteHero.coverPlaceholderUri}
            noteHeroCoverUri={noteHero.coverUri}
            noteHeroHeight={noteHero.height}
            noteHeroId={noteHero.id}
            noteHeroMeta={noteHero.meta}
            noteHeroMetaColor={noteHeroMetaColor}
            noteHeroRole="list"
            noteHeroTitle={noteHero.title}
            noteHeroTitleColor={noteHeroTitleColor}
            style={[styles.fill, style]}
          >
            {list}
          </YohakuNoteHeroHost>
        ) : (
          list
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  attachment: { position: 'absolute', width: 0, height: 0 },
  statusScrim: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 50,
  },
})

function MarkedScrollView(props: ScrollViewProps) {
  return (
    <ScrollViewMarker
      scrollEdgeEffects={pageScrollEdgeEffects(false)}
      style={styles.fill}
    >
      <ScrollView {...props}>
        {props.children}
        <YohakuScrollAttachment style={styles.attachment} />
      </ScrollView>
    </ScrollViewMarker>
  )
}

function HiddenTopScrollView(props: ScrollViewProps) {
  return (
    <ScrollViewMarker
      scrollEdgeEffects={pageScrollEdgeEffects(true)}
      style={styles.fill}
    >
      <ScrollView {...props}>
        {props.children}
        <YohakuScrollAttachment style={styles.attachment} />
      </ScrollView>
    </ScrollViewMarker>
  )
}
