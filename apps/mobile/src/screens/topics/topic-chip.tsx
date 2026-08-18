import { useRouter } from 'expo-router'
import { StyleSheet, View } from 'react-native'

import { AppText, NativePressable } from '@/components/ui'
import type { TopicRow } from '@/db/schema'
import { useTranslations } from '@/i18n'
import { usePalette } from '@/theme/palette'

import { TopicIcon } from './topic-icon'

export function TopicChip({ topic }: { topic: TopicRow }) {
  const router = useRouter()
  const t = useTranslations('topic')
  const palette = usePalette()

  return (
    <NativePressable
      accessibilityLabel={t('chip', { name: topic.name })}
      style={styles.row}
      onPress={() =>
        router.push({
          pathname: '/series/[slug]',
          params: { slug: topic.slug, topicId: topic.id },
        })
      }
    >
      <AppText color={palette.neutral[7]} variant="meta">
        {t('chipPrefix')}
      </AppText>
      <TopicIcon size="sm" uri={topic.icon} />
      <AppText color={palette.neutral[7]} variant="meta">
        {topic.name}
      </AppText>
    </NativePressable>
  )
}

export function TopicNameRow({
  size,
  topic,
}: {
  size: 'md' | 'lg'
  topic: TopicRow
}) {
  const palette = usePalette()
  return (
    <View style={styles.nameRow}>
      <TopicIcon size={size} uri={topic.icon} />
      <AppText
        color={palette.neutral[size === 'lg' ? 10 : 9]}
        style={size === 'lg' ? undefined : styles.entryName}
        variant={size === 'lg' ? 'largeTitle' : 'entryTitle'}
      >
        {topic.name}
      </AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  entryName: {
    flex: 1,
  },
})
