import {
  type EventSubscription,
  requireNativeModule,
  requireNativeViewManager,
} from 'expo-modules-core'
import type { ComponentType } from 'react'
import type { NativeSyntheticEvent, ViewProps } from 'react-native'

export type TtsRemoteAction = 'pause' | 'play' | 'stop'

type TtsEvents = {
  onTtsEnded: () => void
  onTtsError: (event: { message: string }) => void
  onTtsInterrupted: (event: { shouldResume: boolean }) => void
  onTtsRemote: (event: { action: TtsRemoteAction }) => void
  onTtsTime: (event: { duration: number; elapsed: number }) => void
}

interface YohakuNativeModule {
  addListener<K extends keyof TtsEvents>(
    eventName: K,
    listener: TtsEvents[K],
  ): EventSubscription
  circularImageUri(url: string): Promise<{
    height: number
    scale: number
    uri: string
    width: number
  }>
  configureCompactNativeTabBar(): Promise<void>
  databaseBytes(): number
  liquidGlassAvailable: boolean
  loadTts(payload: {
    artist: string
    rate: number
    title: string
    url: string
  }): Promise<void>
  pauseTts(): Promise<void>
  playTts(): Promise<void>
  preloadTts(url: string): Promise<void>
  setTtsRate(rate: number): Promise<void>
  stopTts(): Promise<void>
}

export const YohakuNative = requireNativeModule<YohakuNativeModule>('Yohaku')

type ScrollEdgeContainerProps = ViewProps & {
  edge?: 'bottom' | 'top'
}

export const ScrollEdgeContainer: ComponentType<ScrollEdgeContainerProps> =
  requireNativeViewManager('Yohaku')

type LegacyScrollEdgeMaskProps = ViewProps & {
  bottomEdgeHeight: number
  bottomProgress: number
  topEdgeHeight: number
  topProgress: number
}

export const LegacyScrollEdgeMask: ComponentType<LegacyScrollEdgeMaskProps> =
  requireNativeViewManager('Yohaku', 'LegacyScrollEdgeMask')

type NavigationHeaderTitleProps = ViewProps & {
  progress: number
  subtitle: string
  subtitleColor: string
  subtitleFontSize: number
  title: string
  titleColor: string
  titleFontSize: number
}

export const NavigationHeaderTitle: ComponentType<NavigationHeaderTitleProps> =
  requireNativeViewManager('Yohaku', 'NavigationHeaderTitle')

export type NavigationHeaderMenuItem = {
  hidden?: boolean
  icon?: string
  id: string
  title: string
}

type NavigationHeaderControlProps = ViewProps & {
  controlIdentifier: string
  controlKind: 'button' | 'menu'
  controlLabel: string
  cornerRadius: number
  haptic: boolean
  iconColor: string
  iconName: string
  menuItems: NavigationHeaderMenuItem[]
  onMenuAction?: (event: NativeSyntheticEvent<{ id: string }>) => void
  onNativePress?: (event: NativeSyntheticEvent<Record<string, never>>) => void
  paperColor: string
  ringColor: string
  shadowOpacity: number
}

export const NavigationHeaderControl: ComponentType<NavigationHeaderControlProps> =
  requireNativeViewManager('Yohaku', 'NavigationHeaderControl')

export type GroupedListNativeRow = {
  chevron: boolean
  danger: boolean
  id: string
  label: string
  pressable: boolean
  value?: string
}

type GroupedListViewProps = ViewProps & {
  dangerColor: string
  onNativeHeight?: (event: NativeSyntheticEvent<{ height: number }>) => void
  onRowPress?: (event: NativeSyntheticEvent<{ id: string }>) => void
  rows: GroupedListNativeRow[]
}

export const GroupedListView: ComponentType<GroupedListViewProps> =
  requireNativeViewManager('Yohaku', 'GroupedList')

type NativePressViewProps = ViewProps & {
  disabled: boolean
  haptic: boolean
  onNativePress?: (event: NativeSyntheticEvent<Record<string, never>>) => void
  pressScale: number
  pressTranslateY: number
}

export const NativePressView: ComponentType<NativePressViewProps> =
  requireNativeViewManager('Yohaku', 'NativePress')
