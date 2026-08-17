import { useRouter } from 'expo-router'
import { StyleSheet, View } from 'react-native'

import { AppText, NativePressable } from '@/components/ui'
import type { TopicRow } from '@/db/schema'
import { useTranslations } from '@/i18n'
import { usePalette } from '@/theme/palette'

import { TopicNameRow } from '../topics/topic-chip'

export function NoteTopicBlock({ topic }: { topic: TopicRow | null }) {
  const router = useRouter()
  const t = useTranslations('topic')
  const palette = usePalette()
  if (!topic) return null

  return (
    <NativePressable
      accessibilityLabel={t('chip', { name: topic.name })}
      onPress={() =>
        router.push({
          pathname: '/series/[slug]',
          params: { slug: topic.slug, topicId: topic.id },
        })
      }
    >
      <View style={[styles.rule, { backgroundColor: palette.neutral[3] }]} />
      <AppText color={palette.neutral[7]} variant="meta">
        {t('inTopic')}
      </AppText>
      <View style={styles.name}>
        <TopicNameRow size="md" topic={topic} />
      </View>
      {topic.introduce ? (
        <AppText color={palette.neutral[7]} variant="secondary">
          {topic.introduce}
        </AppText>
      ) : null}
    </NativePressable>
  )
}

const styles = StyleSheet.create({
  rule: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 18,
  },
  name: {
    marginTop: 8,
    marginBottom: 6,
  },
})
