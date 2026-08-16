import { SymbolView } from 'expo-symbols'
import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'

import { AppText, RemoteImage, SlotText } from '@/components/ui'
import { useTranslations } from '@/i18n'
import type { DeskMedia } from '@/owner/live-desk'
import { buildMediaByline, projectMediaPositionMs } from '@/owner/live-desk'
import { useOwner } from '@/owner/store'
import { useDeskSnapshot } from '@/owner/use-desk-snapshot'
import { fonts } from '@/theme/fonts'
import { splashEasing, timings } from '@/theme/motion'
import type { Palette } from '@/theme/palette'
import { usePalette } from '@/theme/palette'

export function DeskSheet() {
  const t = useTranslations('desk')
  const owner = useOwner()
  const palette = usePalette()
  const snapshot = useDeskSnapshot()

  const media = snapshot.visible ? snapshot.media : null
  const application = snapshot.visible ? snapshot.application : null
  const title = media
    ? (media.title ?? media.artist ?? media.playerDisplayName ?? '')
    : (application?.displayName ?? '')
  const byline = media ? buildMediaByline(media) : (application?.detail ?? null)
  const stateText = media
    ? t(media.playbackState === 'playing' ? 'playing' : 'paused')
    : t('using')
  const stateLine = media?.playerDisplayName
    ? `${media.playerDisplayName} · ${stateText}`
    : stateText
  const iconUrl = media?.artworkUrl ?? application?.iconUrl ?? null

  return (
    // RNScreens only sizes a formSheet's ScrollView when it is the direct
    // child of the screen content — wrapping it in a View blanks the sheet.
    <ScrollView
      contentContainerStyle={styles.content}
      style={{ backgroundColor: palette.surface.desk }}
    >
      <View style={styles.head}>
        <AppText color={palette.neutral[6]} style={styles.eyebrow}>
          LIVE DESK
        </AppText>
        <View style={styles.ownerRow}>
          <View
            style={[styles.ownerDot, { backgroundColor: palette.accent }]}
          />
          <AppText color={palette.neutral[7]} style={styles.ownerName}>
            {owner?.name ?? ''}
          </AppText>
        </View>
      </View>

      {snapshot.visible ? (
        <>
          <View style={styles.body}>
            <View
              style={[
                styles.slip,
                {
                  backgroundColor: palette.surface.desk,
                  borderColor: palette.neutral[4],
                },
              ]}
            >
              {iconUrl ? (
                <RemoteImage
                  contentFit="cover"
                  style={styles.slipImage}
                  uri={iconUrl}
                />
              ) : (
                <SymbolView
                  name={media ? 'music.note' : 'macwindow'}
                  size={18}
                  tintColor={palette.neutral[6]}
                />
              )}
            </View>
            <View style={styles.titles}>
              <AppText
                color={palette.neutral[10]}
                numberOfLines={1}
                style={styles.title}
              >
                {title}
              </AppText>
              {byline ? (
                <AppText
                  color={palette.neutral[7]}
                  numberOfLines={1}
                  style={styles.byline}
                >
                  {byline}
                </AppText>
              ) : null}
              <AppText
                color={palette.neutral[6]}
                numberOfLines={1}
                style={styles.state}
              >
                {stateLine}
              </AppText>
            </View>
          </View>

          {media ? <MediaProgress media={media} palette={palette} /> : null}

          {media && application ? (
            <AppText color={palette.neutral[6]} style={styles.alsoUsing}>
              {t('alsoUsing', { app: application.displayName })}
            </AppText>
          ) : null}
        </>
      ) : (
        <AppText color={palette.neutral[6]} style={styles.quiet}>
          {t('quiet')}
        </AppText>
      )}
    </ScrollView>
  )
}

function MediaProgress({
  media,
  palette,
}: {
  media: DeskMedia
  palette: Palette
}) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (media.playbackState !== 'playing' || media.positionMs === null) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [media.anchorAt, media.playbackState, media.positionMs])

  const positionMs = projectMediaPositionMs(media, now)
  if (positionMs === null) return null

  const progress =
    media.durationMs !== null && media.durationMs > 0
      ? Math.min(100, Math.max(0, (positionMs / media.durationMs) * 100))
      : null

  return (
    <View style={styles.progressRow}>
      <InkMeter
        active={media.playbackState === 'playing'}
        color={palette.neutral[6]}
      />
      {progress !== null ? (
        <View style={[styles.track, { backgroundColor: palette.neutral[3] }]}>
          <View
            style={[
              styles.fill,
              { backgroundColor: palette.neutral[8], width: `${progress}%` },
            ]}
          />
        </View>
      ) : (
        <View style={styles.trackSpacer} />
      )}
      <View style={styles.timeRow}>
        <SlotText
          textStyle={{ ...styles.time, color: palette.neutral[6] }}
          value={formatDuration(positionMs)}
        />
        {media.durationMs !== null ? (
          <AppText color={palette.neutral[6]} style={styles.time}>
            {` / ${formatDuration(media.durationMs)}`}
          </AppText>
        ) : null}
      </View>
    </View>
  )
}

const METER_HEIGHTS = [5, 9, 6]

function InkMeter({ active, color }: { active: boolean; color: string }) {
  return (
    <View style={styles.meter}>
      {METER_HEIGHTS.map((height, index) => (
        <MeterBar
          active={active}
          color={color}
          delay={index * 180}
          height={height}
          key={height}
        />
      ))}
    </View>
  )
}

function MeterBar({
  active,
  color,
  delay,
  height,
}: {
  active: boolean
  color: string
  delay: number
  height: number
}) {
  const scale = useSharedValue(0.55)

  useEffect(() => {
    if (!active) {
      scale.set(withTiming(0.55, timings.fade))
      return
    }
    scale.set(
      withDelay(
        delay,
        withRepeat(
          withTiming(1, { duration: 550, easing: splashEasing.breath }),
          -1,
          true,
        ),
      ),
    )
  }, [active, delay, scale])

  const style = useAnimatedStyle(() => ({
    transform: [{ scaleY: scale.value }],
  }))

  return (
    <Animated.View
      style={[styles.meterBar, { backgroundColor: color, height }, style]}
    />
  )
}

function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000)
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 16,
  },
  head: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eyebrow: {
    ...fonts.sans,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  ownerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  ownerDot: {
    borderRadius: 3,
    height: 5,
    width: 5,
  },
  ownerName: {
    fontSize: 12,
    lineHeight: 18,
  },
  body: {
    flexDirection: 'row',
    gap: 12,
  },
  slip: {
    alignItems: 'center',
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
    height: 44,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 44,
  },
  slipImage: {
    height: '100%',
    width: '100%',
  },
  titles: {
    flex: 1,
    gap: 1,
  },
  title: {
    ...fonts.sansMedium,
    fontSize: 15,
    lineHeight: 22,
  },
  byline: {
    fontSize: 13,
    lineHeight: 19,
  },
  state: {
    fontSize: 12,
    lineHeight: 18,
  },
  progressRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  meter: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 1.5,
    height: 10,
  },
  meterBar: {
    borderRadius: 1,
    width: 2,
  },
  track: {
    borderRadius: 999,
    flex: 1,
    height: 3,
    overflow: 'hidden',
  },
  trackSpacer: {
    flex: 1,
  },
  fill: {
    borderRadius: 999,
    height: '100%',
  },
  timeRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  time: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    lineHeight: 16,
  },
  alsoUsing: {
    ...fonts.serif,
    fontSize: 12,
    lineHeight: 18,
  },
  quiet: {
    ...fonts.serif,
    fontSize: 13,
    lineHeight: 20,
    paddingVertical: 16,
    textAlign: 'center',
  },
})
