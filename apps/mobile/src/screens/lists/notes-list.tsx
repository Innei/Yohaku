import { type as typeScale } from '@yohaku/design-system/tokens'
import { desc, eq } from 'drizzle-orm'
import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { useRouter } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import * as WebBrowser from 'expo-web-browser'
import { useCallback, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

import { primeArticleBody } from '@/components/dom/prime-body'
import { AppText, NativePressable } from '@/components/ui'
import { db } from '@/db'
import type { NoteRow } from '@/db/schema'
import { notes } from '@/db/schema'
import { useLocale, useTranslations } from '@/i18n'
import { formatNoteListDate } from '@/lib/datetime'
import { siteHref } from '@/lib/site-url'
import { ingestNotePage } from '@/sync/engine'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'

import { ListShell } from './list-shell'
import { NoteLatest } from './note-latest'
import {
  groupNotesByYear,
  hasMoreNotes,
  letterCountLabel,
  nextNoteListPage,
  splitLatestNote,
} from './note-timeline'

function openNote(note: NoteRow, router: ReturnType<typeof useRouter>) {
  const webUrl = siteHref(`/notes/${note.nid}`)
  if (note.hasPassword || note.contentFormat === 'markdown') {
    void WebBrowser.openBrowserAsync(webUrl)
    return
  }
  if (note.contentFormat === 'lexical' && note.content) {
    primeArticleBody({
      content: note.content,
      enrichments: note.enrichments ?? undefined,
      key: note.id,
      variant: 'note',
      webUrl,
    })
  }
  router.push({
    pathname: '/notes/[nid]',
    params: { nid: String(note.nid) },
  })
}

function moodLine(note: NoteRow): string {
  return [note.weather, note.mood].filter(Boolean).join(' · ')
}

export function NotesListScreen() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('list')
  const palette = usePalette()
  const query = useMemo(
    () =>
      db
        .select()
        .from(notes)
        .where(eq(notes.lang, locale))
        .orderBy(desc(notes.createdAt)),
    [locale],
  )
  const { data } = useLiveQuery(query, [locale])
  const notesInLocale = data ?? []
  const { latest, older } = useMemo(() => splitLatestNote(data ?? []), [data])
  const groups = useMemo(() => groupNotesByYear(older), [older])
  const [paging, setPaging] = useState({
    fetchedPage: 0,
    locale,
    total: null as number | null,
  })
  const total = paging.locale === locale ? paging.total : null
  const fetchedPage = paging.locale === locale ? paging.fetchedPage : 0
  const [loadingMore, setLoadingMore] = useState(false)
  const loadingMoreRef = useRef(false)
  const localeRef = useRef(locale)
  localeRef.current = locale

  const onEndReached = useCallback(() => {
    const loaded = notesInLocale.length
    if (loadingMoreRef.current || !hasMoreNotes(loaded, total)) return
    const requestedLocale = locale
    loadingMoreRef.current = true
    setLoadingMore(true)
    void ingestNotePage(nextNoteListPage(loaded, fetchedPage), requestedLocale)
      .then((paged) => {
        if (localeRef.current !== requestedLocale) return
        setPaging({
          fetchedPage: paged.pagination.page,
          locale: requestedLocale,
          total: paged.pagination.total,
        })
      })
      .catch(() => {})
      .finally(() => {
        loadingMoreRef.current = false
        setLoadingMore(false)
      })
  }, [fetchedPage, locale, notesInLocale.length, total])

  return (
    <ListShell isEmpty={notesInLocale.length === 0} onEndReached={onEndReached}>
      {latest ? (
        <NoteLatest note={latest} onOpen={() => openNote(latest, router)} />
      ) : null}
      {groups.length > 0 ? (
        <View>
          <View style={styles.rule}>
            <View
              style={[styles.ruleLine, { backgroundColor: palette.neutral[3] }]}
            />
            <AppText
              color={palette.neutral[6]}
              style={styles.ruleLabel}
              variant="eyebrow"
            >
              {t('olderNotes')}
            </AppText>
            <View
              style={[styles.ruleLine, { backgroundColor: palette.neutral[3] }]}
            />
          </View>
          {groups.map((group, groupIndex) => (
            <View
              key={group.year}
              style={groupIndex > 0 ? styles.laterYear : undefined}
            >
              <View
                style={[
                  styles.yearHead,
                  { borderBottomColor: palette.neutral[3] },
                ]}
              >
                <View>
                  <AppText
                    color={palette.semantic.warning}
                    style={styles.anno}
                    variant="eyebrow"
                  >
                    Anno
                  </AppText>
                  <AppText style={styles.yearNum} variant="largeTitle">
                    {group.year}
                  </AppText>
                </View>
                <AppText style={styles.yearCount} variant="eyebrow">
                  {letterCountLabel(group.notes.length)}
                </AppText>
              </View>
              <View>
                <View
                  pointerEvents="none"
                  style={[
                    styles.spine,
                    { backgroundColor: palette.neutral[3] },
                  ]}
                />
                {group.notes.map((note) => {
                  const mood = moodLine(note)
                  return (
                    <NativePressable
                      key={note.id}
                      style={styles.entry}
                      onPress={() => openNote(note, router)}
                    >
                      <View
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
                      <AppText variant="letterTitle">{note.title}</AppText>
                      {mood ? (
                        <AppText
                          color={palette.neutral[7]}
                          style={styles.mood}
                          variant="meta"
                        >
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
                  )
                })}
              </View>
            </View>
          ))}
        </View>
      ) : null}
      {loadingMore ? (
        <ActivityIndicator color={palette.neutral[5]} style={styles.more} />
      ) : null}
    </ListShell>
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
    ...fonts.serif,
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
    top: 14,
    bottom: 8,
    width: StyleSheet.hairlineWidth,
  },
  entry: {
    position: 'relative',
    paddingLeft: 22,
    paddingBottom: 20,
  },
  dot: {
    position: 'absolute',
    left: 4,
    top: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  stackDate: {
    marginBottom: 4,
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
  more: {
    marginTop: 16,
  },
})
