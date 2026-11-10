import { Stack, useNavigation } from 'expo-router'
import type { ReactNode } from 'react'
import { useCallback, useLayoutEffect, useRef } from 'react'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'

import { SymbolView } from 'expo-symbols'

export interface ToolbarActionProps {
  asChild?: boolean
  children?: ReactNode
  placement?: 'left' | 'right'
}

/**
 * Android has no UIKit toolbar, and an absolutely positioned JS control is
 * unreachable: the native (transparent) stack header floats above the screen
 * and swallows touches in its band. Rendering the same children through
 * `headerRight` puts them inside the header itself, so taps land again.
 */
function AndroidToolbar({ children, placement = 'right' }: ToolbarActionProps) {
  const navigation = useNavigation()
  // The header element is created once and kept stable; `children` are mostly
  // static icon controls, and re-registering on every render would make the
  // navigator re-render in a loop.
  const content = useRef<ReactNode>(children)
  content.current = children

  const renderHeaderRight = useCallback(
    () => (
      <View pointerEvents="box-none" style={styles.cluster}>
        {content.current}
      </View>
    ),
    [],
  )

  useLayoutEffect(() => {
    // The Android header already owns the back affordance; registering a left
    // item would draw a second chevron.
    if (placement === 'left') return
    navigation.setOptions({ headerRight: renderHeaderRight })
    return () => {
      navigation.setOptions({ headerRight: undefined })
    }
  }, [navigation, placement, renderHeaderRight])

  return null
}

function AndroidToolbarButton({
  accessibilityLabel,
  icon,
  onPress,
  tintColor,
}: {
  accessibilityLabel?: string
  icon?: string
  onPress?: () => void
  tintColor?: string
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed ? styles.pressed : null]}
    >
      {icon ? (
        <SymbolView name={icon as never} size={18} tintColor={tintColor ?? '#2b2b28'} />
      ) : null}
    </Pressable>
  )
}

function AndroidToolbarMenu({
  accessibilityLabel,
  children,
  icon,
}: {
  accessibilityLabel?: string
  children?: ReactNode
  icon?: string
}) {
  return (
    <View accessibilityLabel={accessibilityLabel} style={styles.menu}>
      <SymbolView name={(icon ?? 'ellipsis') as never} size={18} tintColor="#2b2b28" />
      {children}
    </View>
  )
}

function AndroidToolbarMenuAction({ children }: { children?: ReactNode }) {
  return <Text style={styles.menuAction}>{children}</Text>
}

type ToolbarComponent = ((props: ToolbarActionProps) => ReactNode) & {
  Button: typeof AndroidToolbarButton
  Menu: typeof AndroidToolbarMenu
  MenuAction: typeof AndroidToolbarMenuAction
}

const AndroidToolbarComponent = Object.assign(AndroidToolbar, {
  Button: AndroidToolbarButton,
  Menu: AndroidToolbarMenu,
  MenuAction: AndroidToolbarMenuAction,
}) as unknown as ToolbarComponent

/**
 * `Stack.Toolbar` replacement.
 *
 * expo-router renders Stack.Toolbar as a bottom floating Compose toolbar on
 * Android, which collides with the paper tab bar. The same children are
 * forwarded into the native header instead, preserving the iOS 26 paper layout
 * while keeping the controls tappable.
 */
export const Toolbar: any =
  Platform.OS === 'ios' ? Stack.Toolbar : AndroidToolbarComponent

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  cluster: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    // Measured on device: the native back arrow sits ~73px from the left edge
    // while the stock header inset left the action pill ~115px from the right.
    // Pulling the cluster out by the delta makes the two icons mirror.
    marginRight: -6,
    paddingRight: 0,
  },
  menu: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuAction: {
    color: '#2b2b28',
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pressed: {
    opacity: 0.7,
  },
})
