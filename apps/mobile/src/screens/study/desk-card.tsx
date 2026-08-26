import * as Linking from 'expo-linking'
import { SymbolView } from 'expo-symbols'
import { useEffect, useRef, useState } from 'react'
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
  createSeatClock,
  deskSeatKey,
  formatSeatElapsed,
  seatRailPath,
} from '@/owner/desk-seat'
import {
  buildMediaByline,
  type DeskApplication,
  type DeskMedia,
  projectMediaPositionMs,
} from '@/owner/live-desk'
import {
  musicPlaybackTarget,
  openMusicPlayback,
} from '@/owner/music-playback'
import { useOwner } from '@/owner/store'
import { useDeskSnapshot } from '@/owner/use-desk-snapshot'
import { fonts } from '@/theme/fonts'
import { splashEasing } from '@/theme/motion'
import type { Palette } from '@/theme/palette'
import { usePalette } from '@/theme/palette'

const CARD_MIN_HEIGHT = 128
const SEAT_TICK_MS = 15_000

export function DeskCard() {
  const t = useTranslations('desk')
  const owner = useOwner()
  const palette = usePalette()
  const snapshot = useDeskSnapshot()
  const seatClock = useRef(createSeatClock()).current
  const [now, setNow] = useState(() => Date.now())

  const media = snapshot.visible ? snapshot.media : null
  const application = snapshot.visible ? snapshot.application : null
  const title = media
    ? (media.title ?? media.artist ?? media.playerDisplayName ?? '')
    : (application?.displayName ?? '')
  const live = Boolean(owner && title)
  const seatKey = deskSeatKey(snapshot)

  useEffect(() => {
    if (!seatKey) return
    const timer = setInterval(() => setNow(Date.now()), SEAT_TICK_MS)
    return () => clearInterval(timer)
  }, [seatKey])

  const elapsedMs = seatClock.elapsedMs(seatKey, now)
  const alsoUsing =
    media && application ? t('alsoUsing', { app: application.displayName }) : null
  const mediaByline = media ? buildMediaByline(media) : null
  const byline =
    [media ? mediaByline : application?.detail, alsoUsing]
      .filter(Boolean)
      .join(' · ') || null
  const stateText = media
    ? t(media.playbackState === 'playing' ? 'playing' : 'paused')
    : t('using')
  const kicker = media?.playerDisplayName
    ? `${media.playerDisplayName} · ${stateText}`
    : stateText
  const playback = media?.playbackUrl
    ? musicPlaybackTarget(media.playbackUrl)
    : null
  const openLabel = playback
    ? t(playback.provider === 'qq' ? 'openInQqMusic' : 'openInNetease')
    : null
  const iconUrl = media?.artworkUrl ?? application?.iconUrl ?? null
  const ticket = {
    application,
    byline,
    elapsedMs,
    iconUrl,
    kicker,
    media,
    openLabel,
    playback,
    title,
  }
  const lastTicketRef = useRef(ticket)
  if (live) lastTicketRef.current = ticket
  const shown = live ? ticket : lastTicketRef.current

  const still = useSharedValue(live ? 0 : 1)
  useEffect(() => {
    still.set(
      withTiming(live ? 0 : 1, {
        duration: 280,
        easing: splashEasing.seal,
      }),
    )
  }, [live, still])

  const stillStyle = useAnimatedStyle(() => ({ opacity: still.value }))
  const ticketStyle = useAnimatedStyle(() => ({ opacity: 1 - still.value }))

  const card = (
    <GroupedCard style={styles.card}>
      <Animated.View
        accessibilityElementsHidden={live}
        importantForAccessibility={live ? 'no-hide-descendants' : 'yes'}
        pointerEvents={live ? 'none' : 'auto'}
        style={[styles.still, stillStyle]}
      >
        <View style={[styles.stillMark, { backgroundColor: palette.neutral[3] }]}>
          <SymbolView
            name="cup.and.saucer"
            size={20}
            tintColor={palette.neutral[6]}
          />
        </View>
        <AppText color={palette.neutral[7]} variant="secondary">
          {t('quiet')}
        </AppText>
      </Animated.View>

      <Animated.View
        accessibilityElementsHidden={!live}
        importantForAccessibility={live ? 'yes' : 'no-hide-descendants'}
        pointerEvents={live ? 'auto' : 'none'}
        style={[styles.ticket, ticketStyle]}
      >
        <View style={styles.row}>
          {shown.iconUrl ? (
            <RemoteImage
              contentFit="cover"
              style={styles.cover}
              uri={shown.iconUrl}
            />
          ) : (
            <View
              style={[styles.cover, { backgroundColor: palette.neutral[3] }]}
            >
              <SymbolView
                name={shown.media ? 'music.note' : 'macwindow'}
                size={18}
                tintColor={palette.neutral[6]}
              />
            </View>
          )}
          <View style={styles.copy}>
            <View style={styles.kicker}>
              <BreathDot color={palette.accent} />
              <AppText numberOfLines={1} variant="meta">
                {shown.kicker}
              </AppText>
            </View>
            <AppText numberOfLines={1} variant="entryTitleSans">
              {shown.title}
            </AppText>
            {shown.byline ? (
              <AppText numberOfLines={1} variant="secondary">
                {shown.byline}
              </AppText>
            ) : null}
          </View>
        </View>
        {shown.media ? (
          <MediaProgress media={shown.media} palette={palette} />
        ) : shown.application && shown.elapsedMs !== null ? (
          <SeatRail
            application={shown.application}
            elapsedMs={shown.elapsedMs}
            palette={palette}
          />
        ) : null}
      </Animated.View>
    </GroupedCard>
  )

  if (!shown.playback || !shown.openLabel) return card

  return (
    <SinkPressable
      accessibilityLabel={`${shown.title}. ${shown.openLabel}`}
      accessibilityRole="link"
      onPress={() => void openMusicPlayback(shown.playback.httpsUrl, Linking)}
    >
      {card}
    </SinkPressable>
  )
}

function SeatRail({
  application,
  elapsedMs,
  palette,
}: {
  application: DeskApplication
  elapsedMs: number
  palette: Palette
}) {
  const t = useTranslations('desk')
  const elapsed = formatSeatElapsed(elapsedMs)
  const path = seatRailPath(application)

  if (elapsed.kind === 'just') {
    return (
      <AppText color={palette.neutral[7]} style={styles.railLabel}>
        {t('seatedJustNow')}
      </AppText>
    )
  }

  return (
    <View style={styles.rail}>
      <AppText
        color={palette.neutral[7]}
        numberOfLines={1}
        style={[styles.railLabel, path ? fonts.mono : null]}
      >
        {path ?? t('seated')}
      </AppText>
      <AppText color={palette.neutral[6]} style={styles.railClock}>
        {t(elapsed.kind === 'minutes' ? 'seatedMinutes' : 'seatedHours', {
          count: elapsed.count,
        })}
      </AppText>
    </View>
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
    minHeight: CARD_MIN_HEIGHT,
    overflow: 'hidden',
  },
  still: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  stillMark: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  ticket: {
    gap: 12,
    justifyContent: 'center',
    minHeight: CARD_MIN_HEIGHT,
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
  rail: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    minHeight: 16,
  },
  railLabel: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
  railClock: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    lineHeight: 16,
  },
})
