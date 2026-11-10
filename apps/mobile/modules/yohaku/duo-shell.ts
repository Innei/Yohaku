import { requireNativeModule, requireNativeViewManager } from 'expo-modules-core'
import type { ComponentType } from 'react'
import { Platform, type NativeSyntheticEvent, type ViewProps } from 'react-native'

// Android has no Duo shell (the iPad split view). Keeping this module safe on
// both platforms avoids depending on Metro's file-level platform suffix
// resolution for a subpath import.
const HAS_NATIVE_DUO = Platform.OS !== 'android'

function nativeView<T>(name: string): T {
  if (!HAS_NATIVE_DUO) return (() => null) as unknown as T
  return requireNativeViewManager('YohakuDuoShell', name) as T
}

export type DuoBarItem = {
  id: string
  label: string
  menu: { group?: string; id: string; systemImage?: string; title: string }[]
  systemImage: string
}

export const isDuo: boolean = HAS_NATIVE_DUO
  ? requireNativeModule<{ isDuo: boolean }>('YohakuDuoShell').isDuo
  : false

export type DuoImageSource = {
  height?: number
  scale: number
  uri: string
  width?: number
}

export const NativeDuoTabs: ComponentType<
  ViewProps & {
    activeTintColor?: string
    inactiveTintColor?: string
    onTabSelect?: (event: NativeSyntheticEvent<{ index: number }>) => void
    selectedIndex: number
  }
> = nativeView('DuoTabs')

export const NativeDuoTab: ComponentType<
  ViewProps & {
    icon?: DuoImageSource
    iconRenderingMode?: 'original' | 'template'
    selectedIcon?: DuoImageSource
    selectedSystemImage?: string
    systemImage?: string
    title: string
  }
> = nativeView('DuoTab')

export type DuoTransitionEvent = {
  closing: boolean
  key: string
  phase: 'end' | 'start'
}

export const NativeDuoStack: ComponentType<
  ViewProps & {
    onNativePop?: (event: NativeSyntheticEvent<{ count: number }>) => void
    onTransition?: (event: NativeSyntheticEvent<DuoTransitionEvent>) => void
  }
> = nativeView('DuoStack')

export const NativeDuoScreen: ComponentType<
  ViewProps & {
    animation?: 'default' | 'fade' | 'none'
    barItems: DuoBarItem[]
    headerShown?: boolean
    onBarItem?: (event: NativeSyntheticEvent<{ id: string }>) => void
    presentation?: 'formSheet' | 'fullScreenModal' | 'modal' | 'push'
    routeKey: string
    sheetDetents?: number[]
    sheetGrabberVisible?: boolean
    sheetLargestUndimmedDetentIndex?: number
    title: string
    titleHidden?: boolean
  }
> = nativeView('DuoScreen')

export type DuoColumnFrame = { left: number; width: number }

export const NativeDuoReadable: ComponentType<
  ViewProps & {
    columnMaxWidth?: number
    onColumnFrame?: (event: NativeSyntheticEvent<DuoColumnFrame>) => void
  }
> = nativeView('DuoReadable')

export const NativeDuoColumn: ComponentType<ViewProps> =
  nativeView('DuoColumn')

export const NativeDuoArrangement: ComponentType<ViewProps> =
  nativeView('DuoArrangement')

export const NativeDuoPane: ComponentType<
  ViewProps & { placement: 'primary' | 'secondary' }
> = nativeView('DuoPane')

export type DuoArticleLayoutMode = {
  asideLeft: number
  asideWidth: number
  bodyLeft: number
  bodyWidth: number
  contentLeft: number
  contentWidth: number
  mode: 'book' | 'flat' | 'single'
}

export const NativeDuoArticleFrame: ComponentType<
  ViewProps & {
    asideAvailable: boolean
    onLayoutMode?: (event: NativeSyntheticEvent<DuoArticleLayoutMode>) => void
  }
> = nativeView('DuoArticleFrame')

export const NativeDuoArticleSlot: ComponentType<
  ViewProps & { crossfades?: boolean }
> = nativeView('DuoArticleSlot')
