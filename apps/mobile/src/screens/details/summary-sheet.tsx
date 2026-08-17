import { and, eq } from 'drizzle-orm'
import { SymbolView } from 'expo-symbols'
import { ScrollView, StyleSheet, View } from 'react-native'

import { AppText } from '@/components/ui'
import { db } from '@/db'
import { notes, posts } from '@/db/schema'
import { useDatabaseSnapshot } from '@/db/use-database-snapshot'
import { useLocale, useTranslations } from '@/i18n'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'

export function SummarySheet({
  kind,
  id,
}: {
  id: string
  kind: 'note' | 'post'
}) {
  const t = useTranslations('notice')
  const palette = usePalette()
  const locale = useLocale()

  const { snapshot } = useDatabaseSnapshot({
    identity: `summary:${locale}:${kind}:${id}`,
    read: async () => {
      const rows = await (kind === 'post'
        ? db
            .select({ articleMeta: posts.articleMeta })
            .from(posts)
            .where(and(eq(posts.id, id), eq(posts.lang, locale)))
            .limit(1)
        : db
            .select({ articleMeta: notes.articleMeta })
            .from(notes)
            .where(and(eq(notes.id, id), eq(notes.lang, locale)))
            .limit(1))
      return rows[0]
    },
    tables: kind === 'post' ? ['posts'] : ['notes'],
  })
  const summary = snapshot?.articleMeta?.summary ?? null

  const stamp =
    summary?.source === 'ai'
      ? [t('aiGenerated'), summary.createdAt?.slice(0, 10)]
          .filter(Boolean)
          .join(' · ')
      : null

  return (
    // RNScreens only sizes a formSheet's ScrollView when it is the direct
    // child of the screen content — wrapping it in a View blanks the sheet.
    <ScrollView
      contentContainerStyle={styles.content}
      style={{ backgroundColor: palette.surface.desk }}
    >
      <View style={styles.head}>
        <SymbolView name="sparkles" size={15} tintColor={palette.accent} />
        <AppText color={palette.neutral[9]} style={styles.title}>
          {summary?.source === 'author' ? t('summary') : t('keyInsights')}
        </AppText>
      </View>
      <AppText color={palette.neutral[8]} style={styles.body}>
        {summary?.text ?? t('summaryMissing')}
      </AppText>
      {stamp ? (
        <AppText color={palette.neutral[5]} style={styles.stamp}>
          {stamp}
        </AppText>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 14,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...fonts.sansMedium,
    fontSize: 15,
    lineHeight: 24,
  },
  body: {
    fontSize: 15,
    lineHeight: 26,
  },
  stamp: {
    ...fonts.sans,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
})
