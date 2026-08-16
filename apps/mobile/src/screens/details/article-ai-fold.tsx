import { useRouter } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import type { ArticleNoticeMeta } from '@/api/article-meta'
import { aiNoticeChips } from '@/api/article-meta'
import { AppText, SinkPressable } from '@/components/ui'
import { useTranslations } from '@/i18n'
import { timings } from '@/theme/motion'
import { usePalette } from '@/theme/palette'

import { ArticleSkillRow } from './article-skill-row'

const BODY_GAP = 10

const foldTiming = {
  ...timings.slot,
  reduceMotion: ReduceMotion.System,
}

export function ArticleAiFold({
  id,
  kind,
  meta,
}: {
  id: string
  kind: 'note' | 'post'
  meta: ArticleNoticeMeta
}) {
  const t = useTranslations('notice')
  const palette = usePalette()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const progress = useSharedValue(0)
  const headerH = useSharedValue(0)
  const bodyH = useSharedValue(0)
  const chips = aiNoticeChips(meta)

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

  if (chips.length === 0) return null

  const labels = chips.map((chip) => {
    if (chip === 'summary') {
      return meta.summary?.source === 'author' ? t('summary') : t('keyInsights')
    }
    if (chip === 'insights') return t('aiInsights')
    return t('skills')
  })

  const toggle = () => {
    const next = !open
    progress.set(withTiming(next ? 1 : 0, foldTiming))
    setOpen(next)
  }

  return (
    <Animated.View style={[styles.wrap, wrapStyle]}>
      <View onLayout={(event) => headerH.set(event.nativeEvent.layout.height)}>
        <SinkPressable
          accessibilityState={{ expanded: open }}
          haptic={false}
          style={styles.header}
          onPress={toggle}
        >
          <View style={styles.head}>
            <SymbolView name="sparkles" size={15} tintColor={palette.accent} />
            <AppText color={palette.neutral[7]} variant="meta">
              {t('aiSection')}
            </AppText>
          </View>
          <View style={styles.trail}>
            <Animated.View
              pointerEvents="none"
              style={[styles.chipLine, chipStyle]}
            >
              <AppText
                color={palette.neutral[6]}
                numberOfLines={1}
                variant="meta"
              >
                {labels.join(' · ')}
              </AppText>
            </Animated.View>
            <Animated.View style={chevronStyle}>
              <SymbolView
                name="chevron.down"
                size={12}
                tintColor={palette.neutral[5]}
              />
            </Animated.View>
          </View>
        </SinkPressable>
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
            onPress={() =>
              router.push({
                pathname: '/insights/[kind]/[id]',
                params: { kind, id },
              })
            }
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    minWidth: 0,
  },
  chipLine: {
    flex: 1,
    minWidth: 0,
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
