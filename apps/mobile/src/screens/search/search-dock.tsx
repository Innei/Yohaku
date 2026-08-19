import { type as typeScale } from '@yohaku/design-system/tokens'
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect'
import { SymbolView } from 'expo-symbols'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import {
  Keyboard,
  StyleSheet,
  TextInput,
  View,
  type ViewStyle,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { AppText, SinkPressable } from '@/components/ui'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'
import { shadow } from '@/theme/surfaces'

function Capsule({
  children,
  interactive = false,
  style,
}: {
  children: ReactNode
  interactive?: boolean
  style?: ViewStyle
}) {
  const palette = usePalette()
  if (isGlassEffectAPIAvailable()) {
    return (
      <GlassView
        colorScheme={palette.theme}
        glassEffectStyle="regular"
        isInteractive={interactive}
        style={[styles.capsule, style]}
      >
        {children}
      </GlassView>
    )
  }
  return (
    <View
      style={[
        styles.capsule,
        style,
        {
          backgroundColor: palette.surface.paper,
          boxShadow: shadow.capsule[palette.theme],
        },
      ]}
    >
      {children}
    </View>
  )
}

function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  useEffect(() => {
    const change = Keyboard.addListener('keyboardWillChangeFrame', (event) => {
      setKeyboardHeight(Math.max(0, event.endCoordinates.height))
    })
    const hide = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardHeight(0)
    })
    return () => {
      change.remove()
      hide.remove()
    }
  }, [])
  return keyboardHeight
}

export function SearchDock({
  clearLabel,
  clearRecentsLabel,
  deleteRecentLabel,
  placeholder,
  recents,
  value,
  onApplyRecent,
  onChangeText,
  onClear,
  onClearRecents,
  onHeight,
  onRemoveRecent,
  onSubmit,
}: {
  clearLabel: string
  clearRecentsLabel: string
  deleteRecentLabel: string
  placeholder: string
  recents: string[]
  value: string
  onApplyRecent: (query: string) => void
  onChangeText: (text: string) => void
  onClear: () => void
  onClearRecents: () => void
  onHeight: (height: number) => void
  onRemoveRecent: (query: string) => void
  onSubmit: () => void
}) {
  const palette = usePalette()
  const insets = useSafeAreaInsets()
  const keyboardHeight = useKeyboardHeight()
  const softwareKeyboard = keyboardHeight > 0
  const showRecents = value.trim().length === 0 && recents.length > 0

  return (
    <View
      style={[
        styles.slot,
        {
          bottom: keyboardHeight,
          paddingBottom: softwareKeyboard ? 8 : Math.max(insets.bottom, 12),
        },
      ]}
      onLayout={(event) => onHeight(event.nativeEvent.layout.height)}
    >
      {showRecents ? (
        <View style={styles.bubbles}>
          {recents.map((query) => (
            <Capsule interactive key={query} style={styles.chip}>
              <SinkPressable
                accessibilityRole="button"
                style={styles.chipMain}
                onPress={() => onApplyRecent(query)}
              >
                <AppText numberOfLines={1} variant="secondary">
                  {query}
                </AppText>
              </SinkPressable>
              <SinkPressable
                accessibilityLabel={deleteRecentLabel}
                hitSlop={8}
                style={styles.chipRemove}
                onPress={() => onRemoveRecent(query)}
              >
                <SymbolView
                  name="xmark"
                  size={10}
                  tintColor={palette.neutral[5]}
                />
              </SinkPressable>
            </Capsule>
          ))}
          <SinkPressable
            accessibilityLabel={clearRecentsLabel}
            hitSlop={8}
            style={styles.clearAll}
            onPress={onClearRecents}
          >
            <AppText variant="meta">{clearRecentsLabel}</AppText>
          </SinkPressable>
        </View>
      ) : null}
      <Capsule>
        <View style={styles.row}>
          <TextInput
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={placeholder}
            placeholderTextColor={palette.neutral[5]}
            returnKeyType="search"
            selectionColor={palette.accent}
            style={[styles.input, { color: palette.neutral[9] }]}
            value={value}
            onChangeText={onChangeText}
            onSubmitEditing={onSubmit}
          />
          {value ? (
            <SinkPressable
              accessibilityLabel={clearLabel}
              hitSlop={8}
              style={styles.clear}
              onPress={onClear}
            >
              <SymbolView
                name="xmark.circle.fill"
                size={18}
                tintColor={palette.neutral[5]}
              />
            </SinkPressable>
          ) : null}
        </View>
      </Capsule>
    </View>
  )
}

const styles = StyleSheet.create({
  slot: {
    position: 'absolute',
    left: 16,
    right: 16,
    gap: 8,
  },
  bubbles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 8,
  },
  chipMain: {
    maxWidth: 200,
  },
  chipRemove: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearAll: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: 'center',
  },
  capsule: {
    overflow: 'hidden',
    borderCurve: 'continuous',
    borderRadius: 999,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  input: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...fonts.sans,
    fontSize: typeScale.copy15.size,
  },
  clear: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
