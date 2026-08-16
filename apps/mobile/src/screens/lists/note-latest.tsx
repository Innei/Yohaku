import { useEffect, useState } from 'react'
import type { LayoutChangeEvent } from 'react-native'
import { StyleSheet, useWindowDimensions, View } from 'react-native'

import { AppText, NativePressable } from '@/components/ui'
import type { NoteRow, TopicRow } from '@/db/schema'
import { useLocale, useTranslations } from '@/i18n'
import { formatNoteListDate } from '@/lib/datetime'
import { ArticleMetaLine } from '@/screens/details/article-meta-line'
import { refreshNoteBody } from '@/sync/engine'
import { bodyIsStale } from '@/sync/merge'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'

import { TopicChip } from '../topics/topic-chip'
import { NotePreview } from './note-preview'
import { noteShowsInlineBody } from './note-timeline'

const previewMinHeight = 360
const previewViewportRatio = 0.48
const fadeStops = [0.08, 0.2, 0.38, 0.58, 0.78, 0.94] as const

export function NoteLatest({
  note,
  onOpen,
  onTitleLayout,
  topic,
}: {
  note: NoteRow
  onOpen: () => void
  onTitleLayout?: (event: LayoutChangeEvent) => void
  topic: TopicRow | null
}) {
  const locale = useLocale()
  const t = useTranslations('list')
  const td = useTranslations('detail')
  const tc = useTranslations('common')
  const palette = usePalette()
  const { height: windowHeight } = useWindowDimensions()
  const [attempt, setAttempt] = useState(0)
  const [failSig, setFailSig] = useState<string | null>(null)
  const [measured, setMeasured] = useState({ height: 0, id: '' })
  const cap = Math.max(
    previewMinHeight,
    Math.round(windowHeight * previewViewportRatio),
  )
  const inline = noteShowsInlineBody(note)
  const noteId = note.id
  const contentHeight = measured.id === noteId ? measured.height : 0
  const clipped = contentHeight > cap
  const bodyVersion = note.bodyVersion
  const failed = failSig === `${noteId}:${attempt}`

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (note.hasPassword || note.contentFormat === 'markdown') return
      if (!bodyIsStale(note)) return
      try {
        await refreshNoteBody(note)
      } catch {
        if (!cancelled) setFailSig(`${noteId}:${attempt}`)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId, bodyVersion, note.hasPassword, note.contentFormat, attempt])

  return (
    <View style={styles.root}>
      <View>
        <NativePressable onPress={onOpen}>
          <View style={styles.heading} onLayout={onTitleLayout}>
            <ArticleMetaLine
              parts={[
                note.weather,
                note.mood,
                formatNoteListDate(note.createdAt, locale),
              ]}
            />
            <AppText variant="largeTitle">{note.title}</AppText>
          </View>
        </NativePressable>
        {topic ? <TopicChip topic={topic} /> : null}
        <NativePressable onPress={onOpen}>
          {inline ? (
            <View style={[styles.preview, { maxHeight: cap }]}>
              <View
                onLayout={(event) =>
                  setMeasured({
                    height: event.nativeEvent.layout.height,
                    id: noteId,
                  })
                }
              >
                <NotePreview content={note.content ?? ''} />
              </View>
              {clipped ? (
                <View pointerEvents="none" style={styles.fade}>
                  {fadeStops.map((opacity) => (
                    <View
                      key={opacity}
                      style={[
                        styles.fadeStop,
                        { backgroundColor: palette.surface.desk, opacity },
                      ]}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          ) : note.hasPassword ? (
            <AppText style={styles.fallback} variant="secondary">
              {td('passwordHint')}
            </AppText>
          ) : note.contentFormat === 'markdown' ? (
            <AppText style={styles.fallback} variant="secondary">
              {tc('openInBrowser')}
            </AppText>
          ) : failed ? null : (
            <AppText style={styles.fallback} variant="secondary">
              {td('bodyLoading')}
            </AppText>
          )}
        </NativePressable>
        {failed ? (
          <AppText
            style={styles.fallback}
            variant="secondary"
            onPress={() => setAttempt((n) => n + 1)}
          >
            {td('bodyFailed')}
          </AppText>
        ) : null}
      </View>
      <View style={[styles.footer, { borderTopColor: palette.neutral[3] }]}>
        <AppText
          color={palette.semantic.warning}
          style={styles.letterNo}
          variant="eyebrow"
        >
          {`Yohaku · Letter №${note.nid}`}
        </AppText>
        <NativePressable onPress={onOpen}>
          <AppText
            color={palette.semantic.warning}
            style={styles.readFull}
            variant="meta"
          >
            {`${t('readFullNote')} →`}
          </AppText>
        </NativePressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    gap: 16,
  },
  heading: {
    gap: 8,
  },
  preview: {
    overflow: 'hidden',
    marginTop: 16,
  },
  fade: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    height: 88,
  },
  fadeStop: {
    flex: 1,
  },
  fallback: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  letterNo: {
    flexShrink: 1,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  readFull: {
    ...fonts.serif,
    letterSpacing: 0.4,
  },
})
