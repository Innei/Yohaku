import { eq } from 'drizzle-orm'
import { ScrollView, StyleSheet, View } from 'react-native'

import { db } from '@/db'
import { thinkings } from '@/db/schema'
import { useDatabaseSnapshot } from '@/db/use-database-snapshot'
import { usePalette } from '@/theme/palette'

import { ThinkingBody } from '../lists/thinking-body'
import { CommentSection } from './comment-section'

export function ThinkingCommentsSheet({ refId }: { refId: string }) {
  const palette = usePalette()
  const { snapshot: item, updatesEnabled } = useDatabaseSnapshot({
    identity: `thinking-comments:${refId}`,
    read: async () => {
      const rows = await db
        .select()
        .from(thinkings)
        .where(eq(thinkings.id, refId))
        .limit(1)
      return rows[0]
    },
    tables: ['thinkings'],
  })

  return (
    // RNScreens only sizes a formSheet's ScrollView when it is the direct
    // child of the screen content (RNSScreenContentWrapper) — wrapping it in
    // a View leaves it zero-height and blanks the sheet.
    <ScrollView
      automaticallyAdjustKeyboardInsets
      contentContainerStyle={styles.content}
      style={{ backgroundColor: palette.surface.desk }}
    >
      {item ? (
        <View style={styles.quote}>
          <ThinkingBody content={item.content} enrichments={item.enrichments} />
          <View
            style={[styles.hairline, { backgroundColor: palette.neutral[3] }]}
          />
        </View>
      ) : null}
      <CommentSection
        allowComment={item?.allowComment ?? true}
        queriesEnabled={updatesEnabled}
        refId={refId}
        refType="recently"
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 40,
    gap: 20,
  },
  quote: {
    gap: 16,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
  },
})
