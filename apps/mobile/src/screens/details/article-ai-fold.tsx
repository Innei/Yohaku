import { useRouter } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import { useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import type { ArticleNoticeMeta } from '@/api/article-meta'
import { aiNoticeChips } from '@/api/article-meta'
import { insightsTapAction } from '@/api/membership'
import { useSession } from '@/auth/session-store'
import { AppText, NOTICE_ICON_COL, SinkPressable } from '@/components/ui'
import { useTranslations } from '@/i18n'
import { openExternalUrl } from '@/lib/open-external'
import { useMembershipPlans } from '@/screens/me/use-membership'
import { useMembershipCheckout } from '@/screens/me/use-membership-checkout'
import { timings } from '@/theme/motion'
import { usePalette } from '@/theme/palette'
import type { TtsStatus } from '@/tts/use-tts-session'

import {
  aiRowCanFold,
  aiRowListenCaption,
  aiRowTrail,
  shouldShowAiRow,
} from './article-notice-model'
import { ArticleSkillRow } from './article-skill-row'

const BODY_GAP = 10

const foldTiming = {
  ...timings.slot,
  reduceMotion: ReduceMotion.System,
}

export interface ArticleAiListen {
  available: boolean
  current: number
  elapsed: number
  onToggle: () => void
  status: TtsStatus
  total: number
}

function ListenLead({
  caption,
  listen,
}: {
  caption: string
  listen: ArticleAiListen
}) {
  const palette = usePalette()
  const t = useTranslations('tts')
  const playing = listen.status === 'playing'
  const loading = listen.status === 'loading'
  return (
    <SinkPressable
      haptic={false}
      style={styles.head}
      accessibilityLabel={
        loading ? t('loading') : playing ? t('pause') : t('play')
      }
      onPress={listen.onToggle}
    >
      <View style={styles.icon}>
        {loading ? (
          <ActivityIndicator
            color={palette.accent}
            size="small"
            style={styles.spinner}
          />
        ) : (
          <SymbolView
            name={playing ? 'pause.fill' : 'play.fill'}
            size={14}
            style={playing ? undefined : styles.playGlyph}
            tintColor={palette.accent}
          />
        )}
      </View>
      <AppText
        color={palette.neutral[7]}
        style={listen.status === 'idle' ? undefined : styles.time}
        variant="meta"
      >
        {caption}
      </AppText>
    </SinkPressable>
  )
}

export function ArticleAiFold({
  id,
  kind,
  listen,
  meta,
  webUrl,
}: {
  id: string
  kind: 'note' | 'post'
  listen?: ArticleAiListen
  meta: ArticleNoticeMeta | null
  webUrl?: string
}) {
  const t = useTranslations('notice')
  const palette = usePalette()
  const router = useRouter()
  const session = useSession()
  const { data: plans } = useMembershipPlans()
  const { present } = useMembershipCheckout()
  const [open, setOpen] = useState(false)
  const progress = useSharedValue(0)
  const headerH = useSharedValue(0)
  const bodyH = useSharedValue(0)
  const listenAvailable = listen?.available === true
  const chips = meta ? aiNoticeChips(meta) : []
  const canFold = aiRowCanFold(meta)
  const narrating =
    listen?.status === 'loading' ||
    listen?.status === 'playing' ||
    listen?.status === 'paused'

  const wrapStyle = useAnimatedStyle(() => {
    if (headerH.value === 0) return { overflow: 'hidden' as const }
    const extra = bodyH.value > 0 ? BODY_GAP + bodyH.value : 0
    return {
      overflow: 'hidden' as const,
      height: headerH.value + extra * progress.value,
    }
  })

  const bodyStyle = useAnimatedStyle(() => ({
    top: headerH.value + BODY_GAP,
    opacity: progress.value,
  }))

  const chipStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
  }))

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * 180}deg` }],
  }))

  if (!shouldShowAiRow(meta, listenAvailable)) return null

  const labels = chips.map((chip) => {
    if (chip === 'summary') {
      return meta?.summary?.source === 'author' ? t('summary') : t('keyInsights')
    }
    if (chip === 'insights') return t('aiInsights')
    return t('skills')
  })
  const trail = aiRowTrail(labels)
  const listenCaption =
    aiRowListenCaption({
      current: listen?.current ?? 0,
      elapsed: listen?.elapsed ?? 0,
      narrating: narrating === true,
      status: listen?.status ?? 'idle',
      total: listen?.total ?? 0,
    }) ?? t('aiListen')

  const toggle = () => {
    if (!canFold) return
    const next = !open
    progress.set(withTiming(next ? 1 : 0, foldTiming))
    setOpen(next)
  }

  const section = (
    <View style={styles.head}>
      <View style={styles.icon}>
        <SymbolView name="sparkles" size={15} tintColor={palette.accent} />
      </View>
      <AppText color={palette.neutral[7]} variant="meta">
        {t('aiSection')}
      </AppText>
    </View>
  )
  const trailNode =
    trail !== null ? (
      <Animated.View pointerEvents="none" style={[styles.chipLine, chipStyle]}>
        <AppText color={palette.neutral[6]} numberOfLines={1} variant="meta">
          {trail}
        </AppText>
      </Animated.View>
    ) : null
  const foldTrail =
    canFold && trailNode ? (
      <View style={styles.trail}>
        {trailNode}
        <Animated.View style={chevronStyle}>
          <SymbolView
            name="chevron.down"
            size={11}
            tintColor={palette.neutral[5]}
          />
        </Animated.View>
      </View>
    ) : null

  const row = (
    <View style={styles.header}>
      {listenAvailable && listen ? (
        <ListenLead caption={listenCaption} listen={listen} />
      ) : null}
      {canFold ? (
        <SinkPressable
          accessibilityState={{ expanded: open }}
          haptic={false}
          style={styles.foldHit}
          onPress={toggle}
        >
          {listenAvailable ? null : section}
          {foldTrail}
        </SinkPressable>
      ) : (
        foldTrail
      )}
    </View>
  )

  if (!canFold || !meta) {
    return row
  }

  return (
    <Animated.View style={[styles.wrap, wrapStyle]}>
      <View onLayout={(event) => headerH.set(event.nativeEvent.layout.height)}>
        {row}
      </View>
      <Animated.View
        pointerEvents={open ? 'auto' : 'none'}
        style={[styles.body, bodyStyle]}
        onLayout={(event) => bodyH.set(event.nativeEvent.layout.height)}
      >
        {meta.summary ? (
          <SinkPressable
            haptic={false}
            style={styles.item}
            onPress={() =>
              router.push({
                pathname: '/summary/[kind]/[id]',
                params: { kind, id },
              })
            }
          >
            <AppText color={palette.neutral[8]} variant="secondary">
              {meta.summary.source === 'author'
                ? t('summary')
                : t('keyInsights')}
            </AppText>
            <SymbolView
              name="chevron.right"
              size={12}
              tintColor={palette.neutral[5]}
            />
          </SinkPressable>
        ) : null}
        {meta.hasInsights ? (
          <SinkPressable
            haptic={false}
            style={styles.item}
            onPress={() => {
              const action = insightsTapAction({
                checkoutEnabled: plans?.appleIap?.enabled === true,
                locked: meta.paywall?.locked === true,
                loggedIn: !!session,
              })
              if (action === 'login') {
                router.push('/login')
                return
              }
              if (action === 'subscribe') {
                void present()
                return
              }
              if (action === 'web') {
                if (webUrl) void openExternalUrl(webUrl)
                return
              }
              if (action === 'open') {
                router.push({
                  pathname: '/insights/[kind]/[id]',
                  params: { kind, id },
                })
              }
            }}
          >
            <AppText color={palette.neutral[8]} variant="secondary">
              {t('aiInsights')}
            </AppText>
            <SymbolView
              name="chevron.right"
              size={12}
              tintColor={palette.neutral[5]}
            />
          </SinkPressable>
        ) : null}
        {(meta.skills ?? []).length > 0 ? (
          <View style={styles.skillBlock}>
            <AppText color={palette.neutral[6]} variant="meta">
              {t('skills')}
            </AppText>
            {(meta.skills ?? []).map((skill) => (
              <ArticleSkillRow key={skill.id} skill={skill} t={t} />
            ))}
          </View>
        ) : null}
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    alignSelf: 'stretch',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: 10,
  },
  icon: {
    width: NOTICE_ICON_COL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playGlyph: {
    marginLeft: 1,
  },
  spinner: {
    transform: [{ scale: 0.55 }],
  },
  foldHit: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexShrink: 0,
  },
  trail: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    minWidth: 0,
    marginLeft: 'auto',
  },
  chipLine: {
    flex: 1,
    minWidth: 0,
  },
  time: {
    fontVariant: ['tabular-nums'],
  },
  body: {
    position: 'absolute',
    right: 0,
    left: 0,
    gap: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  skillBlock: {
    gap: 8,
    paddingTop: 2,
  },
})
