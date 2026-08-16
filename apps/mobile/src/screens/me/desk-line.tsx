import { Link } from 'expo-router'
import { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'

import { AppText, SinkPressable } from '@/components/ui'
import { useTranslations } from '@/i18n'
import { useOwner } from '@/owner/store'
import { useDeskSnapshot } from '@/owner/use-desk-snapshot'
import { fonts } from '@/theme/fonts'
import { splashEasing } from '@/theme/motion'
import { usePalette } from '@/theme/palette'

export function DeskLine() {
  const t = useTranslations('desk')
  const owner = useOwner()
  const palette = usePalette()
  const snapshot = useDeskSnapshot()

  if (!snapshot.visible || !owner) return null
  const text = snapshot.media?.title
    ? t('lineListening', { name: owner.name, title: snapshot.media.title })
    : snapshot.application
      ? t('lineUsing', {
          app: snapshot.application.displayName,
          name: owner.name,
        })
      : null
  if (!text) return null

  return (
    <Link asChild href="/desk">
      <SinkPressable style={styles.line}>
        <BreathDot color={palette.accent} />
        <AppText
          color={palette.neutral[7]}
          numberOfLines={1}
          style={styles.text}
        >
          {text}
        </AppText>
      </SinkPressable>
    </Link>
  )
}

function BreathDot({ color }: { color: string }) {
  const phase = useSharedValue(1)

  useEffect(() => {
    phase.set(
      withRepeat(
        withTiming(0.35, { duration: 1300, easing: splashEasing.breath }),
        -1,
        true,
      ),
    )
  }, [phase])

  const style = useAnimatedStyle(() => ({ opacity: phase.value }))

  return (
    <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />
  )
}

const styles = StyleSheet.create({
  line: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  text: {
    ...fonts.serif,
    fontSize: 12,
    lineHeight: 18,
  },
  dot: {
    borderRadius: 3,
    height: 5,
    width: 5,
  },
})
