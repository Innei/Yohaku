import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect'
import { SymbolView } from 'expo-symbols'
import { useCallback, useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { fonts } from '@/theme/fonts'
import { springs, timings } from '@/theme/motion'
import { usePalette } from '@/theme/palette'
import { shadow } from '@/theme/surfaces'

import { AppText } from './app-text'
import { getToast, type Toast, useToast } from './toast-store'

function ToastBanner({
  leaving,
  message,
  onExited,
}: {
  leaving: boolean
  message: string
  onExited: () => void
}) {
  const palette = usePalette()
  const glass = isGlassEffectAPIAvailable()
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(-10)
  const style = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [{ translateY: translateY.get() }],
  }))

  useEffect(() => {
    opacity.set(withTiming(1, timings.fade))
    translateY.set(withSpring(0, springs.settle))
  }, [opacity, translateY])

  useEffect(() => {
    if (!leaving) return
    opacity.set(
      withTiming(0, timings.fade, (finished) => {
        if (finished) runOnJS(onExited)()
      }),
    )
    translateY.set(withTiming(-8, timings.fade))
  }, [leaving, onExited, opacity, translateY])

  const inner = (
    <View style={styles.row}>
      <View
        style={[styles.glyph, { backgroundColor: palette.semantic.success }]}
      >
        <SymbolView name="checkmark" size={12} tintColor="#fff" />
      </View>
      <AppText color={palette.neutral[10]} style={styles.message}>
        {message}
      </AppText>
    </View>
  )

  return (
    <Animated.View style={style}>
      {glass ? (
        <GlassView
          colorScheme={palette.theme}
          glassEffectStyle="regular"
          style={styles.pill}
        >
          {inner}
        </GlassView>
      ) : (
        <View
          style={[
            styles.pill,
            {
              backgroundColor: palette.surface.paper,
              boxShadow: shadow.capsule[palette.theme],
            },
          ]}
        >
          {inner}
        </View>
      )}
    </Animated.View>
  )
}

export function ToastHost() {
  const toast = useToast()
  const insets = useSafeAreaInsets()
  const [shown, setShown] = useState<Toast | null>(null)
  if (toast !== null && toast.id !== shown?.id) {
    setShown(toast)
  }

  const onExited = useCallback(() => {
    if (getToast() === null) setShown(null)
  }, [])

  const display = toast ?? shown
  if (!display) return null

  return (
    <View pointerEvents="none" style={[styles.slot, { top: insets.top + 4 }]}>
      <ToastBanner
        key={display.id}
        leaving={toast === null}
        message={display.message}
        onExited={onExited}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  slot: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 40,
  },
  pill: {
    borderCurve: 'continuous',
    borderRadius: 999,
    overflow: 'hidden',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    height: 36,
    paddingLeft: 6,
    paddingRight: 14,
  },
  glyph: {
    alignItems: 'center',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  message: {
    ...fonts.sansMedium,
    fontSize: 13,
    letterSpacing: -0.1,
    lineHeight: 16,
  },
})
