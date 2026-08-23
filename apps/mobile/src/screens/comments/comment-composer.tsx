import { type as typeScale } from '@yohaku/design-system/tokens'
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect'
import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import { StyleSheet, TextInput, View, type ViewStyle } from 'react-native'
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { AppText, SinkPressable } from '@/components/ui'
import { useTranslations } from '@/i18n'
import { fonts } from '@/theme/fonts'
import { timings } from '@/theme/motion'
import { usePalette } from '@/theme/palette'
import { shadow } from '@/theme/surfaces'

export const MAX_COMMENT_LENGTH = 500

/** How strongly the send capsule picks up accent (0–1).
 *  UIGlassEffect.tintColor also honors alpha, but changing it rebuilds
 *  the effect with no fade — this wash is the animatable stand-in. */
const SEND_TINT_ALPHA = 0.45

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

function SendCapsule({
  canSend,
  label,
  onPressIn,
  onSend,
}: {
  canSend: boolean
  label: string
  onPressIn?: () => void
  onSend: () => void
}) {
  const palette = usePalette()
  const armed = useSharedValue(canSend ? 1 : 0)

  useEffect(() => {
    armed.value = withTiming(canSend ? 1 : 0, timings.slot)
  }, [armed, canSend])

  const washStyle = useAnimatedStyle(() => ({
    opacity: armed.value * SEND_TINT_ALPHA,
  }))
  const idleLabel = palette.neutral[6]
  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(armed.value, [0, 1], [idleLabel, '#ffffff']),
  }))

  return (
    <Capsule interactive>
      <View>
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: palette.accent },
            washStyle,
          ]}
        />
        <SinkPressable
          disabled={!canSend}
          style={styles.send}
          onPress={onSend}
          onPressIn={onPressIn}
        >
          <Animated.Text style={[styles.sendLabel, labelStyle]}>
            {label}
          </Animated.Text>
        </SinkPressable>
      </View>
    </Capsule>
  )
}

export function CommentComposer({
  busy,
  editing = false,
  error,
  keyboardHeight,
  replyToName,
  value,
  onCancelReply,
  onChangeText,
  onChromePressIn,
  onHeight,
  onSend,
}: {
  busy: boolean
  editing?: boolean
  error: string | null
  keyboardHeight: number
  replyToName: string | null
  value: string
  onCancelReply: () => void
  onChangeText: (text: string) => void
  onChromePressIn: () => void
  onHeight: (height: number) => void
  onSend: () => void
}) {
  const t = useTranslations('comment')
  const palette = usePalette()
  const insets = useSafeAreaInsets()
  const inputRef = useRef<TextInput>(null)
  const length = value.length
  const canSend = !busy && value.trim().length > 0
  const softwareKeyboard = keyboardHeight > 0

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.slot,
        {
          bottom: keyboardHeight,
          paddingBottom: softwareKeyboard ? 8 : Math.max(insets.bottom, 12),
        },
      ]}
      onLayout={(event) => onHeight(event.nativeEvent.layout.height)}
    >
      {replyToName || editing ? (
        <Capsule interactive style={styles.chip}>
          <AppText color={palette.neutral[7]} variant="meta">
            {editing
              ? t('editingChip')
              : t('replyingTo', { name: replyToName ?? '' })}
          </AppText>
          <SinkPressable
            hitSlop={8}
            onPressIn={onChromePressIn}
            onPress={() => {
              onCancelReply()
              inputRef.current?.focus()
            }}
          >
            <AppText color={palette.neutral[6]} variant="meta">
              ✕
            </AppText>
          </SinkPressable>
        </Capsule>
      ) : null}
      <View pointerEvents="box-none" style={styles.dock}>
        <View style={styles.inputWrap}>
          <Capsule>
            <TextInput
              autoFocus
              multiline
              editable={!busy}
              maxLength={MAX_COMMENT_LENGTH}
              placeholderTextColor={palette.neutral[5]}
              ref={inputRef}
              selectionColor={palette.accent}
              style={[styles.input, { color: palette.neutral[9] }]}
              value={value}
              placeholder={
                replyToName ? t('replyPlaceholder') : t('placeholder')
              }
              onChangeText={onChangeText}
            />
          </Capsule>
        </View>
        <SendCapsule
          canSend={canSend}
          label={busy ? t('sending') : t('send')}
          onPressIn={onChromePressIn}
          onSend={onSend}
        />
      </View>
      {error ? (
        <AppText
          color={palette.semantic.error}
          style={styles.meta}
          variant="meta"
        >
          {error}
        </AppText>
      ) : length > MAX_COMMENT_LENGTH - 100 ? (
        <AppText color={palette.neutral[6]} style={styles.meta} variant="meta">
          {length}/{MAX_COMMENT_LENGTH}
        </AppText>
      ) : null}
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
  capsule: {
    overflow: 'hidden',
    borderCurve: 'continuous',
    borderRadius: 999,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  dock: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  inputWrap: {
    flex: 1,
    minHeight: 44,
    maxHeight: 140,
  },
  input: {
    minHeight: 44,
    maxHeight: 140,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    ...fonts.sans,
    fontSize: typeScale.copy15.size,
  },
  send: {
    height: 44,
    minWidth: 44,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendLabel: {
    ...fonts.sans,
    fontSize: typeScale.copy13.size,
    lineHeight: typeScale.copy13.lineHeight,
  },
  meta: {
    paddingHorizontal: 8,
  },
})
