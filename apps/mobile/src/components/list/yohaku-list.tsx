import type {
  YohakuListNativeItem,
  YohakuListVisibleItem,
} from '@modules/yohaku'
import { YohakuListCellView, YohakuListView } from '@modules/yohaku'
import type { ReactNode } from 'react'
import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleProp,
  ViewStyle,
} from 'react-native'
import { StyleSheet } from 'react-native'

export type YohakuListItem = YohakuListNativeItem

export function YohakuList({
  contentInsetBottom = 0,
  contentInsetTop = 8,
  items,
  refreshing = false,
  renderItem,
  stretchCoverHeight,
  stretchCoverPlaceholderUri,
  stretchCoverUri,
  style,
  onEndReached,
  onItemPress,
  onLinkPress,
  onRefresh,
  onScroll,
  onVisibleItems,
}: {
  contentInsetBottom?: number
  contentInsetTop?: number
  items: YohakuListItem[]
  stretchCoverHeight?: number
  stretchCoverPlaceholderUri?: string | null
  stretchCoverUri?: string | null
  onEndReached?: () => void
  onItemPress?: (item: { id: string; type: string }) => void
  onLinkPress?: (kind: string, value: string) => void
  onRefresh?: () => void
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onVisibleItems?: (items: YohakuListVisibleItem[]) => void
  refreshing?: boolean
  renderItem: (item: YohakuListItem) => ReactNode
  style?: StyleProp<ViewStyle>
}) {
  return (
    <YohakuListView
      contentInsetBottom={contentInsetBottom}
      contentInsetTop={contentInsetTop}
      items={items}
      refreshing={refreshing}
      stretchCoverHeight={stretchCoverHeight}
      stretchCoverPlaceholderUri={stretchCoverPlaceholderUri}
      stretchCoverUri={stretchCoverUri}
      style={style}
      onEndReached={() => onEndReached?.()}
      onItemPress={(event) => onItemPress?.(event.nativeEvent)}
      onRefresh={() => onRefresh?.()}
      onScroll={onScroll}
      onVisibleItems={(event) => onVisibleItems?.(event.nativeEvent.items)}
      onLinkPress={(event) =>
        onLinkPress?.(event.nativeEvent.kind, event.nativeEvent.value)
      }
    >
      {items.map((item) => {
        const child = renderItem(item)
        return child == null ? null : (
          <YohakuListCellView
            itemId={item.id}
            key={item.id}
            style={styles.cell}
          >
            {child}
          </YohakuListCellView>
        )
      })}
    </YohakuListView>
  )
}

const styles = StyleSheet.create({
  cell: {
    marginHorizontal: 20,
  },
})
