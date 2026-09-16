import type { YohakuNoteHeroSpec } from '@modules/yohaku'
import { YohakuNoteHeroHost, YohakuScrollAttachment } from '@modules/yohaku'
import { FlashList } from '@shopify/flash-list'
import type { ReactNode } from 'react'
import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollViewProps,
  StyleProp,
  ViewStyle,
} from 'react-native'
import { ScrollView, StyleSheet, View } from 'react-native'
import { ScrollViewMarker } from 'react-native-screens/experimental'

import { pageScrollEdgeEffects } from '@/components/navigation/scroll-edges'

import { listPrefetchWindow } from './list-prefetch-window'

const viewabilityConfig = { minimumViewTime: 0, itemVisiblePercentThreshold: 0 }

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
        paddingHorizontal: 20,
        paddingTop: contentInsetTop,
        paddingBottom: 24,
      }}
      renderScrollComponent={
        topEdgeEffectHidden ? HiddenTopScrollView : MarkedScrollView
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      onRefresh={onRefresh}
      onScroll={onScroll}
      onViewableItemsChanged={({ viewableItems }) =>
        onVisibleItems?.(listPrefetchWindow(items, viewableItems))
      }
    />
  )

  return noteHero ? (
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
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  attachment: { position: 'absolute', width: 0, height: 0 },
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
