import * as Linking from 'expo-linking'
import { SymbolView } from 'expo-symbols'
import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'

import {
  AppText,
  GroupedCard,
  RemoteImage,
  SinkPressable,
  SlotText,
} from '@/components/ui'
import { useTranslations } from '@/i18n'
import {
  buildMediaByline,
  type DeskMedia,
  projectMediaPositionMs,
} from '@/owner/live-desk'
import {
  musicPlaybackTarget,
  openMusicPlayback,
} from '@/owner/music-playback'
import { useOwner } from '@/owner/store'
import { useDeskSnapshot } from '@/owner/use-desk-snapshot'
import { splashEasing } from '@/theme/motion'
import type { Palette } from '@/theme/palette'
import { usePalette } from '@/theme/palette'

export function DeskCard() {
  const t = useTranslations('desk')
  const owner = useOwner()
  const palette = usePalette()
  const snapshot = useDeskSnapshot()

  if (!snapshot.visible || !owner) return null
  const media = snapshot.media
  const application = snapshot.application
  const title = media
    ? (media.title ?? media.artist ?? media.playerDisplayName ?? '')
    : (application?.displayName ?? '')
  if (!title) return null

  const iconUrl = media?.artworkUrl ?? application?.iconUrl ?? null
  const byline = media
    ? buildMediaByline(media)
    : (application?.detail ?? null)
  const stateText = media
    ? t(media.playbackState === 'playing' ? 'playing' : 'paused')
    : t('using')
  const kicker = media?.playerDisplayName
    ? `${media.playerDisplayName} · ${stateText}`
    : stateText
  const alsoUsing =
    media && application ? t('alsoUsing', { app: application.displayName }) : null
  const playback = media?.playbackUrl
    ? musicPlaybackTarget(media.playbackUrl)
    : null
  const openLabel = playback
    ? t(playback.provider === 'qq' ? 'openInQqMusic' : 'openInNetease')
    : null

  const card = (
    <GroupedCard style={styles.card}>
      <View style={styles.row}>
        {iconUrl ? (
          <RemoteImage
            contentFit="cover"
            style={styles.cover}
            uri={iconUrl}
          />
        ) : (
          <View
            style={[styles.cover, { backgroundColor: palette.neutral[3] }]}
          >
            <SymbolView
              name={media ? 'music.note' : 'macwindow'}
              size={18}
              tintColor={palette.neutral[6]}
            />
          </View>
        )}
        <View style={styles.copy}>
          <View style={styles.kicker}>
            <BreathDot color={palette.accent} />
            <AppText numberOfLines={1} variant="meta">
              {kicker}
            </AppText>
          </View>
          <AppText numberOfLines={1} variant="entryTitleSans">
            {title}
          </AppText>
          {byline ? (
            <AppText numberOfLines={1} variant="secondary">
              {byline}
            </AppText>
          ) : null}
          {alsoUsing ? (
            <AppText numberOfLines={1} variant="meta">
              {alsoUsing}
            </AppText>
          ) : null}
        </View>
      </View>
      {media ? <MediaProgress media={media} palette={palette} /> : null}
    </GroupedCard>
  )

  if (!playback || !openLabel) return card

  return (
    <SinkPressable
      accessibilityLabel={`${title}. ${openLabel}`}
      accessibilityRole="link"
      onPress={() => void openMusicPlayback(playback.httpsUrl, Linking)}
    >
      {card}
    </SinkPressable>
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
    <View style={styles.progress}>
      <View style={[styles.track, { backgroundColor: palette.neutral[3] }]}>
        {progress !== null ? (
          <View
            style={[
              styles.fill,
              { backgroundColor: palette.neutral[8], width: `${progress}%` },
            ]}
          />
        ) : null}
      </View>
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

function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000)
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cover: {
    width: 56,
    height: 56,
    borderRadius: 10,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  copy: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  kicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    borderRadius: 3,
    height: 5,
    width: 5,
  },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  track: {
    borderRadius: 999,
    flex: 1,
    height: 3,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 999,
    height: '100%',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  time: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    lineHeight: 16,
  },
})
