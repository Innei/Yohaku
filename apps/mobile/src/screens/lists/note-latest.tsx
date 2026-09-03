import { neutral, surface } from '@yohaku/design-system/tokens'
import { SymbolView } from 'expo-symbols'
import { useEffect, useMemo, useState } from 'react'
import type { LayoutChangeEvent } from 'react-native'
import { StyleSheet, useWindowDimensions, View } from 'react-native'

import { AppText, NativePressable } from '@/components/ui'
import type { NoteRow, TopicRow } from '@/db/schema'
import { useLocale, useTranslations } from '@/i18n'
import { formatNoteListDate } from '@/lib/datetime'
import { ArticleMetaLine } from '@/screens/details/article-meta-line'
import { refreshNoteBody } from '@/sync/engine'
import { bodyIsStale } from '@/sync/merge'
import { usePalette } from '@/theme/palette'
import { useNativeSerifFontStyle } from '@/theme/serif-font'

import { TopicChip } from '../topics/topic-chip'
import {
  NOTE_LATEST_HERO_HEIGHT,
  noteCoverUrl,
  noteShowsCoverHero,
} from './note-cover'
import { NotePreview } from './note-preview'
import { parseNotePreview } from './note-preview-model'
import { noteShowsInlineBody } from './note-timeline'

function heroWash(hex: string) {
  const r = Number.parseInt(hex.slice(1, 3), 16)
  const g = Number.parseInt(hex.slice(3, 5), 16)
  const b = Number.parseInt(hex.slice(5, 7), 16)
  const stop = (alpha: number) => `rgba(${r},${g},${b},${alpha})`
  return `linear-gradient(180deg, ${stop(0.08)} 0%, ${stop(0.28)} 46%, ${stop(0.78)} 100%)`
}

function deskFadeWash(hex: string) {
  const r = Number.parseInt(hex.slice(1, 3), 16)
  const g = Number.parseInt(hex.slice(3, 5), 16)
  const b = Number.parseInt(hex.slice(5, 7), 16)
  const stop = (alpha: number) => `rgba(${r},${g},${b},${alpha})`
  return `linear-gradient(180deg, ${stop(0)} 0%, ${stop(0.08)} 22%, ${stop(0.22)} 42%, ${stop(0.48)} 64%, ${stop(0.78)} 84%, ${stop(1)} 100%)`
}

const previewMinHeight = 360
const previewViewportRatio = 0.48
const previewFadeHeight = 160

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
  const serifFont = useNativeSerifFontStyle()
  const { height: windowHeight } = useWindowDimensions()
  const [attempt, setAttempt] = useState(0)
  const [failSig, setFailSig] = useState<string | null>(null)
  const [measured, setMeasured] = useState({ height: 0, id: '' })
  const cap = Math.max(
    previewMinHeight,
    Math.round(windowHeight * previewViewportRatio),
  )
  const inline = noteShowsInlineBody(note)
  const coverUrl = noteCoverUrl(note)
  const showHero = noteShowsCoverHero(note)
  const noteId = note.id
  const preview = useMemo(
    () => parseNotePreview(note.content ?? ''),
    [note.content],
  )
  const contentHeight = measured.id === noteId ? measured.height : 0
  const visuallyClipped = contentHeight >= cap
  const showFade = preview.truncated || visuallyClipped
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

  const metaParts = [
    note.weather,
    note.mood,
    formatNoteListDate(note.createdAt, locale),
  ]

  return (
    <View style={styles.root}>
      <View>
        {showHero && coverUrl ? (
          <NativePressable onPress={onOpen}>
            <View style={styles.hero} onLayout={onTitleLayout}>
              <View
                pointerEvents="none"
                style={[
                  styles.heroWash,
                  {
                    experimental_backgroundImage: heroWash(neutral.light[10]),
                  },
                ]}
              />
              <View style={styles.heroCopy}>
                <AppText color={surface.light.paper} variant="meta">
                  {metaParts.filter(Boolean).join(' · ')}
                </AppText>
                <AppText color={surface.light.paper} variant="largeTitle">
                  {note.title}
                </AppText>
              </View>
            </View>
          </NativePressable>
        ) : (
          <NativePressable onPress={onOpen}>
            <View style={styles.heading} onLayout={onTitleLayout}>
              <ArticleMetaLine parts={metaParts} />
              <AppText variant="largeTitle">{note.title}</AppText>
            </View>
          </NativePressable>
        )}
        {topic ? <TopicChip topic={topic} /> : null}
        <NativePressable onPress={onOpen}>
          {inline ? (
            <View
              style={[
                styles.preview,
                { maxHeight: cap },
                visuallyClipped ? { height: cap } : null,
              ]}
            >
              <View
                onLayout={(event) =>
                  setMeasured({
                    height: event.nativeEvent.layout.height,
                    id: noteId,
                  })
                }
              >
                <NotePreview blocks={preview.blocks} />
              </View>
              {showFade ? (
                <View
                  pointerEvents="none"
                  style={[
                    styles.fade,
                    {
                      experimental_backgroundImage: deskFadeWash(
                        palette.surface.desk,
                      ),
                    },
                  ]}
                />
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
          <View style={styles.readFull}>
            <AppText
              color={palette.semantic.warning}
              style={[styles.readFullText, serifFont]}
              variant="meta"
            >
              {t('readFullNote')}
            </AppText>
            <SymbolView
              name="arrow.right"
              size={11}
              tintColor={palette.semantic.warning}
            />
          </View>
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
  hero: {
    height: NOTE_LATEST_HERO_HEIGHT,
    marginHorizontal: -20,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  heroWash: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  heroCopy: {
    paddingHorizontal: 20,
    paddingBottom: 18,
    paddingTop: 40,
    gap: 8,
  },
  preview: {
    overflow: 'hidden',
    marginTop: 16,
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: previewFadeHeight,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readFullText: {
    letterSpacing: 0.4,
  },
})
