import { Image } from 'expo-image'
import * as Haptics from 'expo-haptics'
import { useCallback, useState } from 'react'
import type {
  ColorValue,
  NativeSyntheticEvent,
  StyleProp,
  ViewProps,
  ViewStyle,
} from 'react-native'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { SymbolView } from './icons'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export type NavigationHeaderMenuItem = {
  category?: string
  hidden?: boolean
  icon?: string
  id: string
  on?: boolean
  title: string
}

function tapHaptic(enabled: boolean) {
  if (!enabled) return
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
}

interface NativePressProps extends ViewProps {
  disabled?: boolean
  haptic?: boolean
  longPressEnabled?: boolean
  onNativeLongPress?: (event: NativeSyntheticEvent<Record<string, never>>) => void
  onNativePress?: (event: NativeSyntheticEvent<Record<string, never>>) => void
  pressScale?: number
  pressTranslateY?: number
}

/**
 * UIPressGestureRecognizer parity: press scale + long-press + haptics, backed
 * by Pressable and Reanimated instead of a custom recogniser.
 */
export function NativePressView({
  accessibilityState,
  children,
  disabled = false,
  haptic = false,
  longPressEnabled = false,
  onNativeLongPress,
  onNativePress,
  pressScale = 0.96,
  pressTranslateY = 0,
  style,
  ...rest
}: NativePressProps) {
  const pressed = useSharedValue(0)
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 1 - pressed.value * (1 - pressScale) },
      { translateY: pressed.value * pressTranslateY },
    ],
  }))

  return (
    <AnimatedPressable
      {...rest}
      accessibilityState={{ ...accessibilityState, disabled }}
      disabled={disabled}
      onLongPress={
        longPressEnabled && !disabled
          ? (nativeEvent) => {
              tapHaptic(haptic)
              onNativeLongPress?.(
                nativeEvent as unknown as NativeSyntheticEvent<
                  Record<string, never>
                >,
              )
            }
          : undefined
      }
      onPress={
        disabled
          ? undefined
          : (nativeEvent) => {
              tapHaptic(haptic)
              onNativePress?.(
                nativeEvent as unknown as NativeSyntheticEvent<
                  Record<string, never>
                >,
              )
            }
      }
      onPressIn={() => {
        if (!disabled) pressed.value = withTiming(1, { duration: 90 })
      }}
      onPressOut={() => {
        pressed.value = withTiming(0, { duration: 160 })
      }}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  )
}

interface TicketStubProps extends ViewProps {
  cornerRadius?: number
  divisions?: number
  fillColor?: ColorValue
  notchRadius?: number
  shadowColor?: string
  shadowOffsetY?: number
  shadowOpacity?: number
  shadowRadius?: number
}

/** Ticket shaped paper plate. The perforation is a hairline on Android. */
export function TicketStubView({
  cornerRadius = 16,
  fillColor = 'transparent',
  notchRadius = 0,
  shadowColor,
  shadowOffsetY = 0,
  shadowOpacity = 0,
  shadowRadius = 0,
  style,
  ...rest
}: TicketStubProps) {
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: fillColor,
          borderRadius: cornerRadius,
          boxShadow: shadowOpacity
            ? `0px ${shadowOffsetY}px ${shadowRadius}px ${hexWithAlpha(
                shadowColor ?? '#000',
                shadowOpacity,
              )}`
            : undefined,
        },
        style,
      ]}
    >
      {notchRadius > 0 ? (
        <View
          style={{
            borderColor: 'transparent',
            borderRadius: notchRadius,
            borderWidth: 1,
            opacity: 0.05,
          }}
        />
      ) : null}
    </View>
  )
}

function hexWithAlpha(hex: string, alpha: number) {
  const value = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0')
  return `${hex}${value}`
}

interface GroupedRow {
  chevron: boolean
  danger: boolean
  id: string
  label: string
  menu?: NavigationHeaderMenuItem[]
  navigates: boolean
  pressable: boolean
  value?: string
}

export function GroupedListView({
  dangerColor,
  onNativeMetrics,
  onRowMenuAction,
  onRowPress,
  rows,
  style,
  ...rest
}: ViewProps & {
  dangerColor: string
  onNativeMetrics?: (
    event: NativeSyntheticEvent<{ height: number; textLeading: number }>,
  ) => void
  onRowMenuAction?: (
    event: NativeSyntheticEvent<{ id: string; item: string }>,
  ) => void
  onRowPress?: (event: NativeSyntheticEvent<{ id: string }>) => void
  rows: GroupedRow[]
}) {
  const [menu, setMenu] = useState<{
    items: NavigationHeaderMenuItem[]
    rowId: string
  } | null>(null)

  const onLayout = useCallback(
    (height: number) => {
      onNativeMetrics?.({
        nativeEvent: { height, textLeading: 36 },
      } as NativeSyntheticEvent<{ height: number; textLeading: number }>)
    },
    [onNativeMetrics],
  )

  return (
    <View {...rest} style={style}>
      <View onLayout={(event) => onLayout(event.nativeEvent.layout.height)}>
      {rows.map((row, index) => (
        <View key={row.id}>
          {index > 0 ? <View style={styles.separator} /> : null}
          <Pressable
            accessibilityRole={row.pressable ? 'button' : undefined}
            disabled={!row.pressable && !row.menu}
            onLongPress={
              row.menu ? () => setMenu({ items: row.menu!, rowId: row.id }) : undefined
            }
            onPress={() => {
              if (row.menu && !row.pressable) {
                setMenu({ items: row.menu, rowId: row.id })
                return
              }
              onRowPress?.({
                nativeEvent: { id: row.id },
              } as NativeSyntheticEvent<{ id: string }>)
            }}
            style={({ pressed }) => [
              styles.row,
              pressed && row.pressable ? styles.rowPressed : null,
            ]}
          >
            <Text
              style={[styles.label, row.danger ? { color: dangerColor } : null]}
            >
              {row.label}
            </Text>
            <View style={styles.trailing}>
              {row.value ? (
                <Text style={styles.value} numberOfLines={1}>
                  {row.value}
                </Text>
              ) : null}
              {row.menu ? (
                <Pressable
                  hitSlop={8}
                  onPress={() => setMenu({ items: row.menu!, rowId: row.id })}
                  style={styles.menuButton}
                >
                  <SymbolView name="chevron.up.chevron.down" size={12} tintColor="#9a9a94" />
                </Pressable>
              ) : null}
              {row.chevron || row.navigates ? (
                <SymbolView name="chevron.right" size={13} tintColor="#b6b3ac" />
              ) : null}
            </View>
          </Pressable>
        </View>
      ))}
      </View>
      <MenuSheet
        items={menu?.items ?? []}
        onClose={() => setMenu(null)}
        onSelect={(itemId) => {
          if (menu) {
            onRowMenuAction?.({
              nativeEvent: { id: menu.rowId, item: itemId },
            } as NativeSyntheticEvent<{ id: string; item: string }>)
          }
          setMenu(null)
        }}
        visible={menu !== null}
      />
    </View>
  )
}

export function MenuSheet({
  items,
  onClose,
  onSelect,
  title,
  visible,
}: {
  items: NavigationHeaderMenuItem[]
  onClose: () => void
  onSelect: (id: string) => void
  title?: string
  visible: boolean
}) {
  const insets = useSafeAreaInsets()
  const shown = items.filter((item) => !item.hidden)
  return (
    <Modal
      animationType="slide"
      navigationBarTranslucent
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.sheetRoot}>
        <Pressable onPress={onClose} style={styles.sheetBackdrop} />
        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 12) + 8 },
          ]}
        >
          <View style={styles.sheetGrabber} />
          {title ? <Text style={styles.sheetTitle}>{title}</Text> : null}
          <ScrollView
            bounces={false}
            contentContainerStyle={styles.sheetContent}
            style={styles.sheetScroll}
          >
            {shown.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => onSelect(item.id)}
                style={({ pressed }) => [
                  styles.sheetRow,
                  pressed ? styles.rowPressed : null,
                ]}
              >
                {item.icon ? (
                  <SymbolView name={item.icon} size={18} tintColor="#2b2b28" />
                ) : null}
                <Text style={styles.sheetLabel}>{item.title}</Text>
                {item.on ? (
                  <SymbolView name="checkmark" size={16} tintColor="#c25a76" />
                ) : null}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

interface HeaderControlProps extends ViewProps {
  chrome?: 'paper' | 'header'
  controlIdentifier: string
  controlKind: 'button' | 'menu'
  controlLabel: string
  cornerRadius?: number
  haptic?: boolean
  iconColor?: string
  iconName: string
  menuItems?: NavigationHeaderMenuItem[]
  onMenuAction?: (event: NativeSyntheticEvent<{ id: string }>) => void
  onNativePress?: (event: NativeSyntheticEvent<Record<string, never>>) => void
  paperColor?: string
  ringColor?: string
  shadowOpacity?: number
}

export function NavigationHeaderControl({
  controlKind,
  controlLabel,
  cornerRadius = 20,
  haptic = true,
  chrome = 'paper',
  iconColor = '#2b2b28',
  iconName,
  menuItems = [],
  onMenuAction,
  onNativePress,
  paperColor = '#fff',
  style,
  ...rest
}: HeaderControlProps) {
  const [open, setOpen] = useState(false)
  // Inside the Android navigation header a floating white pill reads as a
  // foreign element, so the header variant is a bare 44pt touch target that
  // matches the native back arrow.
  const headerChrome = chrome === 'header'
  return (
    <>
      <Pressable
        {...rest}
        accessibilityLabel={controlLabel}
        accessibilityRole="button"
        onPress={() => {
          tapHaptic(haptic)
          if (controlKind === 'menu') setOpen(true)
          else
            onNativePress?.({
              nativeEvent: {},
            } as NativeSyntheticEvent<Record<string, never>>)
        }}
        style={({ pressed }) => [
          {
            alignItems: 'center',
            backgroundColor: headerChrome ? 'transparent' : paperColor,
            borderRadius: headerChrome ? 22 : cornerRadius,
            height: headerChrome ? 44 : 40,
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
            width: headerChrome ? 44 : 40,
          },
          headerChrome ? null : styles.controlShadow,
          style,
        ]}
      >
        <SymbolView
          name={iconName}
          size={headerChrome ? 21 : 18}
          tintColor={iconColor}
        />
      </Pressable>
      <MenuSheet
        items={menuItems}
        onClose={() => setOpen(false)}
        onSelect={(id) => {
          setOpen(false)
          onMenuAction?.({
            nativeEvent: { id },
          } as NativeSyntheticEvent<{ id: string }>)
        }}
        visible={open}
      />
    </>
  )
}

export function TextMenuButton({
  controlLabel,
  disabled,
  menuItems = [],
  onMenuAction,
  title,
  titleColor,
  titleSize,
}: ViewProps & {
  controlLabel: string
  disabled?: boolean
  menuItems?: NavigationHeaderMenuItem[]
  onMenuAction?: (event: NativeSyntheticEvent<{ id: string }>) => void
  title: string
  titleColor: string
  titleSize: number
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Pressable
        accessibilityLabel={controlLabel}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={{ opacity: disabled ? 0.4 : 1 }}
      >
        <Text
          style={{
            color: titleColor,
            fontSize: titleSize,
            fontWeight: '600',
            letterSpacing: 0.2,
          }}
        >
          {title}
        </Text>
      </Pressable>
      <MenuSheet
        items={menuItems}
        onClose={() => setOpen(false)}
        onSelect={(id) => {
          setOpen(false)
          onMenuAction?.({ nativeEvent: { id } } as NativeSyntheticEvent<{
            id: string
          }>)
        }}
        visible={open}
      />
    </>
  )
}

export function SettingsAvatar({
  active,
  imageUri,
  ringColor,
  style,
  ...rest
}: ViewProps & {
  active?: boolean
  collapseDistance?: number
  imageUri: string
  ringColor?: string
}) {
  return (
    <View
      {...rest}
      style={[
        {
          borderColor: active ? ringColor : 'transparent',
          borderRadius: 999,
          borderWidth: 2,
          height: 40,
          width: 40,
        },
        style,
      ]}
    >
      <Image
        source={{ uri: imageUri }}
        style={{ borderRadius: 999, height: '100%', width: '100%' }}
      />
    </View>
  )
}

/** Static scrim replacing the iOS variable blur under the navigation bar. */
export function VariableBlurEdge({
  progress = 0,
  readabilityColor,
  style,
  ...rest
}: ViewProps & {
  progress?: number
  readabilityColor: string
}) {
  const opacity = Math.min(1, Math.max(0, progress))
  return (
    <View {...rest} style={style} pointerEvents="none">
      <Svg height="100%" width="100%">
        <Defs>
          <LinearGradient id="top-wash" x1="0" x2="0" y1="0" y2="1">
            <Stop offset="0" stopColor={readabilityColor} stopOpacity={opacity} />
            <Stop offset="0.55" stopColor={readabilityColor} stopOpacity={opacity * 0.75} />
            <Stop offset="1" stopColor={readabilityColor} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect fill="url(#top-wash)" height="100%" width="100%" />
      </Svg>
    </View>
  )
}

export function LegacyScrollEdgeMask({ children, style }: ViewProps) {
  return <View style={style}>{children}</View>
}

/** Unused on Android but kept for API parity. */
export function ScrollEdgeContainer({ children, style }: ViewProps) {
  return <View style={style}>{children}</View>
}

export function YohakuScrollAttachment(_props: ViewProps) {
  return null
}

const styles = StyleSheet.create({
  sheetRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  controlShadow: {
    boxShadow: '0px 2px 8px rgba(0,0,0,0.12)',
  },
  label: {
    color: '#2b2b28',
    flex: 1,
    fontSize: 15,
  },
  menuButton: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    minHeight: 46,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  rowPressed: {
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  separator: {
    backgroundColor: 'rgba(0,0,0,0.08)',
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  sheet: {
    backgroundColor: '#fbfaf7',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '72%',
    paddingTop: 8,
    boxShadow: '0px -8px 32px rgba(0,0,0,0.16)',
  },
  sheetContent: {
    paddingBottom: 4,
  },
  sheetGrabber: {
    alignSelf: 'center',
    backgroundColor: 'rgba(43,43,40,0.18)',
    borderRadius: 2,
    height: 4,
    marginBottom: 10,
    marginTop: 4,
    width: 36,
  },
  sheetScroll: {
    flexGrow: 0,
  },
  sheetLabel: {
    color: '#2b2b28',
    flex: 1,
    fontSize: 15,
  },
  sheetRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    minHeight: 54,
    paddingHorizontal: 22,
  },
  sheetTitle: {
    color: '#8b8880',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    textTransform: 'uppercase',
  },
  trailing: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  value: {
    color: '#8b8880',
    fontSize: 14,
    maxWidth: 160,
  },
})
