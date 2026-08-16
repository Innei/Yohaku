import { eq } from 'drizzle-orm'
import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'

import { AppText, NativePressable } from '@/components/ui'
import { db } from '@/db'
import { topics } from '@/db/schema'
import { useTranslations } from '@/i18n'
import { usePalette } from '@/theme/palette'

import { TopicNameRow } from '../topics/topic-chip'

export function NoteTopicBlock({ topicId }: { topicId: string | null }) {
  const router = useRouter()
  const t = useTranslations('topic')
  const palette = usePalette()
  const query = useMemo(
    () =>
      topicId
        ? db.select().from(topics).where(eq(topics.id, topicId)).limit(1)
        : db.select().from(topics).where(eq(topics.id, '')).limit(0),
    [topicId],
  )
  const { data } = useLiveQuery(query, [topicId ?? ''])
  const topic = data?.[0]
  if (!topic) return null

  return (
    <NativePressable
      accessibilityLabel={t('chip', { name: topic.name })}
      onPress={() =>
        router.push({
          pathname: '/series/[slug]',
          params: { slug: topic.slug },
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
