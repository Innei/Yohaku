import type {
  YohakuListFabricMark,
  YohakuListNativeItem,
  YohakuListVisibleItem,
} from '@modules/yohaku'
import { YohakuListCellView, YohakuListView } from '@modules/yohaku'
import type { ReactNode } from 'react'
import type {
  ColorValue,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleProp,
  ViewStyle,
} from 'react-native'
import { StyleSheet } from 'react-native'

export type YohakuListItem = YohakuListNativeItem
export type { YohakuListFabricMark }

export function YohakuList({
  contentInsetBottom = 0,
  contentInsetTop = 8,
  fabricAccentColor,
  fabricCompactHint,
  fabricDeskColor,
  fabricEnabled = false,
  fabricExpandedHint,
  fabricLabelColor,
  fabricMarks,
  fabricPinnedItemId,
  fabricTickColor,
  items,
  refreshing = false,
  renderItem,
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
  fabricAccentColor?: ColorValue
  fabricCompactHint?: string
  fabricDeskColor?: ColorValue
  fabricEnabled?: boolean
  fabricExpandedHint?: string
  fabricLabelColor?: ColorValue
  fabricMarks?: YohakuListFabricMark[]
  fabricPinnedItemId?: string
  fabricTickColor?: ColorValue
  items: YohakuListItem[]
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
      fabricAccentColor={fabricAccentColor}
      fabricCompactHint={fabricCompactHint}
      fabricDeskColor={fabricDeskColor}
      fabricEnabled={fabricEnabled}
      fabricExpandedHint={fabricExpandedHint}
      fabricLabelColor={fabricLabelColor}
      fabricMarks={fabricMarks}
      fabricPinnedItemId={fabricPinnedItemId}
      fabricTickColor={fabricTickColor}
      items={items}
      refreshing={refreshing}
      style={style}
      onEndReached={() => onEndReached?.()}
      onItemPress={(event) => onItemPress?.(event.nativeEvent)}
      onLinkPress={(event) =>
        onLinkPress?.(event.nativeEvent.kind, event.nativeEvent.value)
      }
      onRefresh={() => onRefresh?.()}
      onScroll={onScroll}
      onVisibleItems={(event) => onVisibleItems?.(event.nativeEvent.items)}
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
