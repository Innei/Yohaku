import { Platform } from 'react-native'

/**
 * Platform dispatcher for the vendored `Yohaku` native module.
 *
 * The app resolves `@modules/yohaku` through the TypeScript path alias, which
 * points at this file on both platforms. A conditional require keeps the
 * Apple implementation (`index.ios.ts` + `ios/`) untouched while Android
 * evaluates only the React Native port in `android/`.
 */
type YohakuModule = typeof import('./index.ios')

const impl: YohakuModule =
  Platform.OS === 'android'
    ? (require('./android') as YohakuModule)
    : (require('./index.ios') as YohakuModule)

export const YohakuNative = impl.YohakuNative
export const YohakuMembershipNative = impl.YohakuMembershipNative
export const ScrollEdgeContainer = impl.ScrollEdgeContainer
export const LegacyScrollEdgeMask = impl.LegacyScrollEdgeMask
export const VariableBlurEdge = impl.VariableBlurEdge
export const NavigationHeaderTitle = impl.NavigationHeaderTitle
export const SettingsAvatar = impl.SettingsAvatar
export const YohakuPager = impl.YohakuPager
export const YohakuVideo = impl.YohakuVideo
export const YohakuTrackMap = impl.YohakuTrackMap
export const YohakuWebEmbed = impl.YohakuWebEmbed
export const YohakuCode = impl.YohakuCode
export const YohakuMath = impl.YohakuMath
export const YohakuKline = impl.YohakuKline
export const YohakuStudyShell = impl.YohakuStudyShell
export const NavigationHeaderControl = impl.NavigationHeaderControl
export const TextMenuButton = impl.TextMenuButton
export const GroupedListView = impl.GroupedListView
export const YohakuNoteHeroHost = impl.YohakuNoteHeroHost
export const YohakuScrollAttachment = impl.YohakuScrollAttachment
export const YohakuStretchCoverHost = impl.YohakuStretchCoverHost
export const NativePressView = impl.NativePressView
export const TicketStubView = impl.TicketStubView
export const RichTextNativeView = impl.RichTextNativeView

export type {
  GroupedListNativeRow,
  NavigationHeaderMenuItem,
  RichPrintPayload,
  TtsRemoteAction,
  YohakuKlineBar,
  YohakuNoteHeroSpec,
} from './index.ios'
