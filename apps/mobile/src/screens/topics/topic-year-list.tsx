import { type as typeScale } from '@yohaku/design-system/tokens'
import { useRouter } from 'expo-router'
import { StyleSheet, View } from 'react-native'

import { AppText, NativePressable } from '@/components/ui'
import type { NoteRow } from '@/db/schema'
import { openNote } from '@/lib/open-article'
import { usePalette } from '@/theme/palette'
import { useNativeSerifFontStyle } from '@/theme/serif-font'

import { letterCountLabel } from '../lists/note-timeline'
import { formatTopicNoteDate } from './topic-list'

export function TopicYearGroups({
  groups,
}: {
  groups: { notes: NoteRow[]; year: number }[]
}) {
  return groups.map((group, groupIndex) => (
    <View key={group.year} style={groupIndex > 0 ? styles.later : undefined}>
      <TopicYearHead count={group.notes.length} year={group.year} />
      {group.notes.map((note) => (
        <TopicNoteRow key={note.id} note={note} />
      ))}
    </View>
  ))
}

function TopicYearHead({ count, year }: { count: number; year: number }) {
  const palette = usePalette()
  const serifFont = useNativeSerifFontStyle()
  return (
    <View style={[styles.yearHead, { borderBottomColor: palette.neutral[3] }]}>
      <View>
        <AppText
          color={palette.semantic.warning}
          style={[styles.anno, serifFont]}
          variant="eyebrow"
        >
          Anno
        </AppText>
        <AppText style={styles.yearNum} variant="largeTitle">
          {year}
        </AppText>
      </View>
      <AppText style={styles.yearCount} variant="eyebrow">
        {letterCountLabel(count)}
      </AppText>
    </View>
  )
}

function TopicNoteRow({ note }: { note: NoteRow }) {
  const router = useRouter()
  const palette = usePalette()
  return (
    <NativePressable
      style={[styles.row, { borderTopColor: palette.neutral[3] }]}
      onPress={() => openNote(router, note)}
    >
      <AppText style={styles.rowDate} variant="meta">
        {formatTopicNoteDate(note.createdAt)}
      </AppText>
      <AppText style={styles.rowTitle} variant="letterTitle">
        {note.title}
      </AppText>
    </NativePressable>
  )
}

const styles = StyleSheet.create({
  later: {
    marginTop: 28,
  },
  yearHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 16,
    paddingBottom: 10,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  anno: {
    letterSpacing: 2.8,
  },
  yearNum: {
    marginTop: 2,
    fontSize: typeScale.display36.size,
    lineHeight: typeScale.display36.lineHeight,
    letterSpacing: -0.6,
  },
  yearCount: {
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 14,
    paddingVertical: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rowDate: {
    width: 42,
    fontVariant: ['tabular-nums'],
  },
  rowTitle: {
    flex: 1,
  },
})
