import {
  type EventSubscription,
  requireNativeModule,
  requireNativeViewManager,
} from 'expo-modules-core'
import type { ComponentType } from 'react'
import type { ColorValue, NativeSyntheticEvent, ViewProps } from 'react-native'

export type TtsRemoteAction = 'pause' | 'play' | 'stop'

type TtsEvents = {
  onTtsEnded: () => void
  onTtsError: (event: { message: string }) => void
  onTtsInterrupted: (event: { shouldResume: boolean }) => void
  onTtsRemote: (event: { action: TtsRemoteAction }) => void
  onTtsTime: (event: { duration: number; elapsed: number }) => void
}

type NativeEvents = TtsEvents & {
  onMeTabLongPress: () => void
}

interface YohakuNativeModule {
  addListener<K extends keyof NativeEvents>(
    eventName: K,
    listener: NativeEvents[K],
  ): EventSubscription
  circularImageUri(url: string): Promise<{
    height: number
    scale: number
    uri: string
    width: number
  }>
  configureCompactNativeTabBar(): Promise<void>
  databaseBytes(): number
  dismissAuthSession(): Promise<void>
  downloadSystemFont(postScriptName: string): Promise<boolean>
  liquidGlassAvailable: boolean
  loadTts(payload: {
    artist: string
    rate: number
    title: string
    url: string
  }): Promise<void>
  openAuthSession(
    url: string,
    scheme: string,
  ): Promise<{ type: 'cancel' } | { type: 'success'; url: string }>
  pauseTts(): Promise<void>
  playTts(): Promise<void>
  preloadTts(url: string): Promise<void>
  prepareNoteHeroTransition(noteId: string): void
  presentSafari(url: string): Promise<void>
  renderMermaid(payload: {
    bg: string
    fg: string
    source: string
  }): Promise<{ height: number; uri: string; width: number }>
  secretDelete(key: string): void
  secretGet(key: string): string | null
  secretSet(key: string, value: string): void
  setRestorableRoute(routeURL: string): Promise<void>
  setTtsRate(rate: number): Promise<void>
  stopTts(): Promise<void>
}

export const YohakuNative = requireNativeModule<YohakuNativeModule>('Yohaku')

type MembershipEvents = {
  onMembershipTransaction: (event: {
    productId: string
    signedTransactionInfo: string
  }) => void
}

type MembershipAccountPayload = {
  appAccountToken: string
  productIds: string[]
}

type MembershipStorePayload = MembershipAccountPayload & {
  privacyUrl: string
  termsUrl: string
}

interface YohakuMembershipNativeModule {
  addListener<K extends keyof MembershipEvents>(
    eventName: K,
    listener: MembershipEvents[K],
  ): EventSubscription
  currentEntitlementJws(
    appAccountToken: string,
    productIds: string[],
  ): Promise<string[]>
  finishMembershipTransaction(signedTransactionInfo: string): Promise<void>
  presentSubscriptionStore(
    appAccountToken: string,
    productIds: string[],
    termsUrl: string,
    privacyUrl: string,
  ): Promise<
    | { signedTransactionInfo: string; status: 'purchased' | 'restored' }
    | { status: 'cancelled' }
  >
  showManageSubscriptions(): Promise<void>
  unfinishedMembershipTransactionJws(
    appAccountToken: string,
    productIds: string[],
  ): Promise<string[]>
}

const membership =
  requireNativeModule<YohakuMembershipNativeModule>('YohakuMembership')

export const YohakuMembershipNative = {
  addListener: membership.addListener.bind(membership),
  currentEntitlementJws: (payload: MembershipAccountPayload) =>
    membership.currentEntitlementJws(
      payload.appAccountToken,
      payload.productIds,
    ),
  finishMembershipTransaction:
    membership.finishMembershipTransaction.bind(membership),
  presentSubscriptionStore: (payload: MembershipStorePayload) =>
    membership.presentSubscriptionStore(
      payload.appAccountToken,
      payload.productIds,
      payload.termsUrl,
      payload.privacyUrl,
    ),
  showManageSubscriptions: membership.showManageSubscriptions.bind(membership),
  unfinishedMembershipTransactionJws: (payload: MembershipAccountPayload) =>
    membership.unfinishedMembershipTransactionJws(
      payload.appAccountToken,
      payload.productIds,
    ),
}

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

type VariableBlurEdgeProps = ViewProps & {
  navigationForegroundColor?: ColorValue
  progress: number
  readabilityColor: ColorValue
}

export const VariableBlurEdge: ComponentType<VariableBlurEdgeProps> =
  requireNativeViewManager('Yohaku', 'VariableBlurEdge')

type NavigationHeaderTitleProps = ViewProps & {
  scrollVelocity: number
  subtitle: string
  subtitleColor: string
  subtitleFontSize: number
  title: string
  titleColor?: string
  titleFontSize: number
  titleFontWeight?: 'bold' | 'heavy' | 'medium' | 'semibold'
  titleVisible: number
}

export const NavigationHeaderTitle: ComponentType<NavigationHeaderTitleProps> =
  requireNativeViewManager('Yohaku', 'NavigationHeaderTitle')

type SettingsAvatarProps = ViewProps & {
  collapseDistance?: number
  imageUri: string
  ringColor?: string
}

export const SettingsAvatar: ComponentType<SettingsAvatarProps> =
  requireNativeViewManager('Yohaku', 'SettingsAvatar')

export type NavigationHeaderMenuItem = {
  category?: string
  hidden?: boolean
  icon?: string
  id: string
  on?: boolean
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

type TextMenuButtonProps = ViewProps & {
  controlLabel: string
  disabled?: boolean
  menuItems: NavigationHeaderMenuItem[]
  onMenuAction?: (event: NativeSyntheticEvent<{ id: string }>) => void
  title: string
  titleColor: string
  titleSize: number
}

export const TextMenuButton: ComponentType<TextMenuButtonProps> =
  requireNativeViewManager('Yohaku', 'TextMenuButton')

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

export type YohakuListNativeItem = {
  categoryName?: string
  categorySlug?: string
  date?: string
  estimatedHeight: number
  hiddenTagCount?: number
  id: string
  tags?: string[]
  title?: string
  type: string
}

export type YohakuListVisibleItem = {
  id: string
  type: string
}

export type YohakuNoteHeroSpec = {
  coverPlaceholderUri?: string | null
  coverUri?: string | null
  height: number
  id: string
  meta: string
  title: string
}

type YohakuListViewProps = ViewProps & {
  contentInsetBottom?: number
  contentInsetTop?: number
  items: YohakuListNativeItem[]
  noteHeroCoverPlaceholderUri?: string | null
  noteHeroCoverUri?: string | null
  noteHeroHeight?: number
  noteHeroId?: string
  noteHeroMeta?: string
  noteHeroMetaColor?: ColorValue
  noteHeroTitle?: string
  noteHeroTitleColor?: ColorValue
  topEdgeEffectHidden?: boolean
  onEndReached?: (event: NativeSyntheticEvent<Record<string, never>>) => void
  onItemPress?: (
    event: NativeSyntheticEvent<{ id: string; type: string }>,
  ) => void
  onLinkPress?: (
    event: NativeSyntheticEvent<{ kind: string; value: string }>,
  ) => void
  onRefresh?: (event: NativeSyntheticEvent<Record<string, never>>) => void
  onScroll?: (
    event: NativeSyntheticEvent<{
      adjustedContentInset: {
        bottom: number
        left: number
        right: number
        top: number
      }
      contentInset: { bottom: number; left: number; right: number; top: number }
      contentOffset: { x: number; y: number }
      contentSize: { height: number; width: number }
      layoutMeasurement: { height: number; width: number }
      zoomScale: number
    }>,
  ) => void
  onVisibleItems?: (
    event: NativeSyntheticEvent<{ items: YohakuListVisibleItem[] }>,
  ) => void
  refreshing?: boolean
}

export const YohakuListView: ComponentType<YohakuListViewProps> =
  requireNativeViewManager('Yohaku', 'YohakuList')

type YohakuNoteHeroHostProps = ViewProps & {
  noteHeroCoverPlaceholderUri?: string | null
  noteHeroCoverUri?: string | null
  noteHeroHeight?: number
  noteHeroId?: string
  noteHeroMeta?: string
  noteHeroMetaColor?: ColorValue
  noteHeroTitle?: string
  noteHeroTitleColor?: ColorValue
}

export const YohakuNoteHeroHost: ComponentType<YohakuNoteHeroHostProps> =
  requireNativeViewManager('Yohaku', 'YohakuNoteHeroHost')

type YohakuStretchCoverHostProps = ViewProps & {
  stretchCoverAnchorY?: number
  stretchCoverHeight?: number
  stretchCoverPlaceholderUri?: string | null
  stretchCoverUri?: string | null
}

export const YohakuStretchCoverHost: ComponentType<YohakuStretchCoverHostProps> =
  requireNativeViewManager('Yohaku', 'YohakuStretchCoverHost')

type YohakuListCellViewProps = ViewProps & {
  itemId: string
}

export const YohakuListCellView: ComponentType<YohakuListCellViewProps> =
  requireNativeViewManager('Yohaku', 'YohakuListCell')

type NativePressViewProps = ViewProps & {
  disabled: boolean
  haptic: boolean
  longPressEnabled: boolean
  onNativeLongPress?: (
    event: NativeSyntheticEvent<Record<string, never>>,
  ) => void
  onNativePress?: (event: NativeSyntheticEvent<Record<string, never>>) => void
  pressScale: number
  pressTranslateY: number
}

export const NativePressView: ComponentType<NativePressViewProps> =
  requireNativeViewManager('Yohaku', 'NativePress')

type TicketStubViewProps = ViewProps & {
  cornerRadius: number
  divisions: number
  fillColor?: ColorValue
  notchRadius: number
  shadowColor?: string
  shadowOffsetY?: number
  shadowOpacity?: number
  shadowRadius?: number
}

export const TicketStubView: ComponentType<TicketStubViewProps> =
  requireNativeViewManager('Yohaku', 'TicketStub')
