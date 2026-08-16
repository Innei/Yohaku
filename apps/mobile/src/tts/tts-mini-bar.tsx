import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect'
import { SymbolView } from 'expo-symbols'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { AppText, SinkPressable } from '@/components/ui'
import { useTranslations } from '@/i18n'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'
import { shadow } from '@/theme/surfaces'

import { formatDuration } from './format'
import type { TtsStatus } from './use-tts-session'

export function TtsMiniBar({
  autoFollow,
  current,
  duration: _duration,
  elapsed,
  onCycleRate,
  onRecenter,
  onStop,
  onToggle,
  playbackRate,
  stale,
  status,
  total,
}: {
  autoFollow: boolean
  current: number
  duration: number
  elapsed: number
  onCycleRate: () => void
  onRecenter: () => void
  onStop: () => void
  onToggle: () => void
  playbackRate: number
  stale: boolean
  status: TtsStatus
  total: number
}) {
  const palette = usePalette()
  const t = useTranslations('tts')
  const insets = useSafeAreaInsets()
  const glass = isGlassEffectAPIAvailable()
  const loading = status === 'loading'
  const playing = status === 'playing'
  const rateLabel = playbackRate === 1 ? '1×' : `${playbackRate}×`

  const inner = (
    <View style={styles.row}>
      <SinkPressable
        accessibilityLabel={playing ? t('pause') : t('play')}
        disabled={loading}
        style={[styles.play, { backgroundColor: palette.accent }]}
        onPress={onToggle}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <SymbolView
            name={playing ? 'pause.fill' : 'play.fill'}
            size={16}
            tintColor="#fff"
          />
        )}
      </SinkPressable>
      <View style={styles.readout}>
        <View style={styles.timeRow}>
          <AppText color={palette.neutral[10]} style={styles.time}>
            {loading ? '—' : formatDuration(elapsed)}
          </AppText>
          {stale ? (
            <View
              style={[
                styles.stale,
                { backgroundColor: palette.semantic.warning },
              ]}
            />
          ) : null}
        </View>
        <AppText color={palette.neutral[6]} style={styles.seg}>
          {loading ? t('loading') : t('segment', { current, total })}
        </AppText>
      </View>
      <SinkPressable
        accessibilityLabel={rateLabel}
        disabled={loading}
        style={styles.ghost}
        onPress={onCycleRate}
      >
        <AppText color={palette.neutral[7]} style={styles.rate}>
          {rateLabel}
        </AppText>
      </SinkPressable>
      {autoFollow ? null : (
        <SinkPressable
          accessibilityLabel={t('recenter')}
          style={styles.ghost}
          onPress={onRecenter}
        >
          <SymbolView name="scope" size={18} tintColor={palette.neutral[7]} />
        </SinkPressable>
      )}
      <SinkPressable
        accessibilityLabel={t('stop')}
        style={styles.ghost}
        onPress={onStop}
      >
        <SymbolView name="xmark" size={16} tintColor={palette.neutral[7]} />
      </SinkPressable>
    </View>
  )

  return (
    <View
      pointerEvents="box-none"
      style={[styles.slot, { bottom: Math.max(insets.bottom, 12) }]}
    >
      {glass ? (
        <GlassView
          colorScheme={palette.theme}
          glassEffectStyle="regular"
          style={styles.glass}
        >
          {inner}
        </GlassView>
      ) : (
        <View
          style={[
            styles.glass,
            {
              backgroundColor: palette.surface.paper,
              boxShadow: shadow.capsule[palette.theme],
            },
          ]}
        >
          {inner}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  slot: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  glass: {
    borderCurve: 'continuous',
    borderRadius: 28,
    overflow: 'hidden',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    height: 56,
    paddingLeft: 6,
    paddingRight: 8,
  },
  play: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  readout: {
    flex: 1,
    gap: 0,
    justifyContent: 'center',
    minWidth: 0,
    paddingLeft: 2,
  },
  timeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  time: {
    ...fonts.sansMedium,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.2,
    lineHeight: 15,
  },
  stale: {
    borderRadius: 99,
    height: 5,
    width: 5,
  },
  seg: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    lineHeight: 13,
  },
  ghost: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    minWidth: 36,
    paddingHorizontal: 6,
  },
  rate: {
    ...fonts.sansMedium,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
})
