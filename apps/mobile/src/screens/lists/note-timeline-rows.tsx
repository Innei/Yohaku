import { type as typeScale } from '@yohaku/design-system/tokens'
import { SymbolView } from 'expo-symbols'
import { StyleSheet, View } from 'react-native'

import { AppText, NativePressable } from '@/components/ui'
import type { NoteRow, TopicRow } from '@/db/schema'
import { useLocale, useTranslations } from '@/i18n'
import { formatNoteListDate } from '@/lib/datetime'
import { usePalette } from '@/theme/palette'
import { useNativeSerifFontStyle } from '@/theme/serif-font'

import { TopicChip } from '../topics/topic-chip'
import { letterCountLabel } from './note-timeline'

export function moodLine(note: NoteRow): string {
  return [note.weather, note.mood].filter(Boolean).join(' · ')
}

export function NotesOlderRule() {
  const t = useTranslations('list')
  const palette = usePalette()
  return (
    <View style={styles.rule}>
      <View style={[styles.ruleLine, { backgroundColor: palette.neutral[3] }]} />
      <AppText
        color={palette.neutral[6]}
        style={styles.ruleLabel}
        variant="eyebrow"
      >
        {t('olderNotes')}
      </AppText>
      <View style={[styles.ruleLine, { backgroundColor: palette.neutral[3] }]} />
    </View>
  )
}

export function NoteYearHead({
  count,
  later,
  year,
}: {
  count: number
  later?: boolean
  year: number
}) {
  const palette = usePalette()
  const serifFont = useNativeSerifFontStyle()
  return (
    <View style={later ? styles.laterYear : undefined}>
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
    </View>
  )
}

export function NoteTimelineRow({
  note,
  topic,
  onOpen,
}: {
  note: NoteRow
  onOpen: () => void
  topic: TopicRow | null
}) {
  const locale = useLocale()
  const palette = usePalette()
  const mood = moodLine(note)
  return (
    <View style={styles.entry}>
      <View
        pointerEvents="none"
        style={[styles.spine, { backgroundColor: palette.neutral[3] }]}
      />
      <NativePressable style={styles.press} onPress={onOpen}>
        <View style={styles.dateRow}>
          <View
            pointerEvents="none"
            style={[
              styles.dot,
              {
                backgroundColor: palette.surface.desk,
                borderColor: palette.neutral[4],
              },
            ]}
          />
          <AppText style={styles.stackDate} variant="eyebrow">
            {formatNoteListDate(note.createdAt, locale)}
          </AppText>
        </View>
        <AppText variant="letterTitle">{note.title}</AppText>
        {mood ? (
          <AppText color={palette.neutral[7]} style={styles.mood} variant="meta">
            {mood}
          </AppText>
        ) : null}
        <View style={styles.letterMeta}>
          {note.hasPassword ? (
            <SymbolView
              name="lock.fill"
              size={10}
              tintColor={palette.semantic.warning}
            />
          ) : null}
          <AppText
            color={palette.semantic.warning}
            style={styles.letterNo}
            variant="eyebrow"
          >
            {`Letter №${note.nid}`}
          </AppText>
        </View>
      </NativePressable>
      {topic ? <TopicChip topic={topic} /> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  rule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    marginBottom: 28,
  },
  ruleLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  ruleLabel: {
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  laterYear: {
    marginTop: 40,
  },
  yearHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 16,
    paddingBottom: 10,
    marginBottom: 18,
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
  spine: {
    position: 'absolute',
    left: 7,
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
  },
  entry: {
    position: 'relative',
    paddingLeft: 22,
    paddingBottom: 20,
  },
  press: {
    overflow: 'visible',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginLeft: -18,
    marginBottom: 4,
  },
  dot: {
    width: 8,
    height: 8,
    flexShrink: 0,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  stackDate: {
    letterSpacing: 1.6,
  },
  mood: {
    marginTop: 6,
  },
  letterMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  letterNo: {
    letterSpacing: 2.2,
  },
})
