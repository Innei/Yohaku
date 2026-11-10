import type { ComponentType } from 'react'
import type { ScrollViewProps, ViewProps } from 'react-native'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useHeaderHeight } from 'expo-router/react-navigation'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { YohakuNoteHeroHost, YohakuStretchCoverHost } from './hero'
import type { NavigationHeaderMenuItem } from './ui'
import {
  YohakuCode,
  YohakuKline,
  YohakuMath,
  YohakuTrackMap,
  YohakuVideo,
  YohakuWebEmbed,
} from './media'
import { RichTextView } from './rich-text'
import {
  GroupedListView,
  LegacyScrollEdgeMask,
  NavigationHeaderControl,
  NativePressView,
  ScrollEdgeContainer,
  SettingsAvatar,
  TextMenuButton,
  TicketStubView,
  VariableBlurEdge,
  YohakuScrollAttachment,
} from './ui'

export {
  GroupedListView,
  LegacyScrollEdgeMask,
  NavigationHeaderControl,
  NativePressView,
  ScrollEdgeContainer,
  SettingsAvatar,
  TextMenuButton,
  TicketStubView,
  VariableBlurEdge,
  YohakuCode,
  YohakuKline,
  YohakuMath,
  YohakuNoteHeroHost,
  YohakuScrollAttachment,
  YohakuStretchCoverHost,
  YohakuTrackMap,
  YohakuVideo,
  YohakuWebEmbed,
}

export { YohakuMembershipNative, YohakuNative } from './native'
export type { RichPrintPayload, TtsRemoteAction } from './native'

/** The iOS native `RichText` view is called `RichTextNativeView` in JS. */
export const RichTextNativeView: ComponentType<{
  blocks: unknown[]
  highlights: unknown[]
  menuItems: unknown[]
  typography: Record<string, unknown>
  onBlockRects?: (event: unknown) => void
  onContentHeight?: (event: unknown) => void
  onHighlightPress?: (event: unknown) => void
  onLinkPress?: (event: unknown) => void
  onMenuAction?: (event: unknown) => void
  onSelectionActive?: (event: unknown) => void
}> = RichTextView as unknown as ComponentType<any>

export interface YohakuNoteHeroSpec {
  coverPlaceholderUri?: string | null
  coverUri?: string | null
  height: number
  id: string
  meta: string
  title: string
}

export type GroupedListNativeRow = {
  chevron: boolean
  danger: boolean
  id: string
  label: string
  menu?: NavigationHeaderMenuItem[]
  navigates: boolean
  pressable: boolean
  value?: string
}

export type { NavigationHeaderMenuItem }

export type YohakuKlineBar = {
  c: number
  h: number
  l: number
  o: number
  t: number
  v: number
}

export type NavigationHeaderMenuItemShape = {
  category?: string
  hidden?: boolean
  icon?: string
  id: string
  on?: boolean
  title: string
}

/** SwiftUI pager has no Android consumer yet; keep the export for parity. */
export function YohakuPager({ children, style }: ViewProps) {
  return <View style={style}>{children}</View>
}

/** Static header title. Android uses `collapsing-header-title.android.tsx`. */
export function NavigationHeaderTitle({
  subtitle,
  subtitleColor,
  subtitleFontSize,
  title,
  titleColor,
  titleFontSize,
  titleFontWeight,
  titleVisible,
}: ViewProps & {
  scrollVelocity: number
  subtitle: string
  subtitleColor: string
  subtitleFontSize: number
  title: string
  titleColor?: string
  titleFontSize: number
  titleFontWeight?: 'bold' | 'heavy' | 'medium' | 'semibold'
  titleVisible: number
}) {
  return (
    <View style={styles.headerTitle}>
      <Text
        numberOfLines={1}
        style={{
          color: titleColor,
          fontSize: titleFontSize,
          fontWeight:
            titleFontWeight === 'bold' || titleFontWeight === 'heavy'
              ? '700'
              : titleFontWeight === 'medium'
                ? '500'
                : '600',
          opacity: titleVisible,
        }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          numberOfLines={1}
          style={{ color: subtitleColor, fontSize: subtitleFontSize }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  )
}

/** Scroll shell with the owner's collapsing avatar. */
export function YohakuStudyShell({
  children,
  style,
}: ViewProps & {
  collapseDistance?: number
  ownerImageUri?: string
  ringColor?: string
} & ScrollViewProps) {
  const insets = useSafeAreaInsets()
  const headerHeight = useHeaderHeight()
  // The transparent Android header still reserves a band, but it does not push
  // the scroll content down; without this the profile body started underneath
  // the status bar.
  const topPadding = (headerHeight > 0 ? headerHeight : insets.top) + 8

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      style={style}
      contentContainerStyle={{ paddingTop: topPadding, paddingBottom: insets.bottom + 24 }}
    >
      {children}
    </ScrollView>
  )
}


const styles = StyleSheet.create({
  headerTitle: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '100%',
  },
})
