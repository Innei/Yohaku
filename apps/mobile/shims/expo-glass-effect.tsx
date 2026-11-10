import type { ReactNode } from 'react'
import type { ViewProps } from 'react-native'
import { View } from 'react-native'

/**
 * Android platform shim for `expo-glass-effect`. Liquid Glass is an iOS 26
 * material; `isGlassEffectAPIAvailable` reports false so screens keep their
 * solid paper fallbacks, and GlassView stays a passthrough for safety.
 */
export function isGlassEffectAPIAvailable() {
  return false
}

export function isLiquidGlassAvailable() {
  return false
}

export function GlassView({ children, ...rest }: ViewProps) {
  return <View {...rest}>{children}</View>
}

export function GlassContainer({ children, ...rest }: ViewProps) {
  return <View {...rest}>{children}</View>
}

export type GlassViewProps = ViewProps & { children?: ReactNode }
