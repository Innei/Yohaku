import { YohakuStretchCoverHost } from '@modules/yohaku'
import { and, eq } from 'drizzle-orm'
import { Stack, useRouter } from 'expo-router'
import { useHeaderHeight } from 'expo-router/react-navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ScrollView } from 'react-native'
import { Dimensions, StyleSheet, View } from 'react-native'

import { translatedBodyNeedsRefresh } from '@/api/article-meta'
import { api } from '@/api/client'
import { EdgeEffectScrollView } from '@/components/navigation/edge-effect-scroll-view'
import { AppText } from '@/components/ui'
import { db } from '@/db'
import { notes, topics } from '@/db/schema'
import { useDatabaseSnapshot } from '@/db/use-database-snapshot'
import { useLocale, useTranslations } from '@/i18n'
import { recordReading } from '@/interactions/reading'
import { presentArticleToc, tocHref } from '@/lib/article-toc'
import { formatRelativeTime } from '@/lib/datetime'
import { extractHeadings } from '@/lib/lexical-headings'
import { openExternalUrl } from '@/lib/open-external'
import { siteHref } from '@/lib/site-url'
import { useOwner } from '@/owner/store'
import { CommentComposeHost } from '@/screens/comments/comment-compose-provider'
import {
  noteCoverPlaceholderUri,
  noteCoverUrl,
  noteDetailCoverAnchorY,
  noteDetailCoverHeight,
} from '@/screens/lists/note-cover'
import { refreshNoteBody } from '@/sync/engine'
import {
  bodyIsStale,
  calibrateNoteMeta,
  decorationIsStale,
  noteBodyFromApi,
  noteMetaFromApi,
} from '@/sync/merge'
import { noteBodyConflictSet } from '@/sync/upsert-sets'
import { usePalette } from '@/theme/palette'
import { TtsMiniBar } from '@/tts/tts-mini-bar'
import { useTtsSession } from '@/tts/use-tts-session'

import { ArticleBody } from './article-body'
import { ArticleMetaLine } from './article-meta-line'
import { ArticleMore } from './article-more'
import { ArticleNotice } from './article-notice'
import { useArticlePrint } from './article-print-host'
import { ArticleTail } from './article-tail'
import { BodyLoadingIndicator, useReservedBodyHeight } from './body-slot'
import { NoteCoverBleed } from './note-cover-bleed'
import { NoteTopicBlock } from './note-topic-block'
import { useCollapsingTitle } from './use-collapsing-title'
import { useReadingPresence } from './use-reading-presence'
import { useRetryableBodyRefresh } from './use-retryable-body-refresh'

export function NoteDetailScreen({ nid }: { nid: number }) {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('detail')
  const tc = useTranslations('common')
  const tt = useTranslations('tabs')
  const tp = useTranslations('print')
  const owner = useOwner()
  const { host: printHost, print } = useArticlePrint()
  const palette = usePalette()
  const reservedBodyHeight = useReservedBodyHeight()
  const headerHeight = useHeaderHeight()
  const scrollRef = useRef<ScrollView>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  const { snapshot, updatesEnabled } = useDatabaseSnapshot({
    identity: `note:${locale}:${nid}`,
    read: async () => {
      const rows = await db
        .select({ note: notes, topic: topics })
        .from(notes)
        .leftJoin(
          topics,
          and(eq(notes.topicId, topics.id), eq(topics.lang, locale)),
        )
        .where(and(eq(notes.nid, nid), eq(notes.lang, locale)))
        .limit(1)
      return rows[0]
    },
    tables: ['notes', 'topics'],
  })
  const note = snapshot?.note
  const topic = snapshot?.topic
  const coverUrl = noteCoverUrl(note ?? {})
  const coverPlaceholderUri = noteCoverPlaceholderUri(note?.coverThumbhash)
  const noteId = note?.id
  const bodyVersion = note?.bodyVersion
  const isMarkdown = note?.contentFormat === 'markdown'
  const isLocked = Boolean(note?.hasPassword)
  const openOnWeb = isLocked || isMarkdown
  const webUrl = siteHref(`/notes/${nid}`)

  useEffect(() => {
    if (!noteId || !updatesEnabled) return
    void recordReading(db, { refId: noteId, kind: 'note', lang: locale })
  }, [locale, noteId, updatesEnabled])

  useRetryableBodyRefresh({
    enabled:
      updatesEnabled &&
      Boolean(note) &&
      !openOnWeb &&
      translatedBodyNeedsRefresh(note?.articleMeta),
    refresh: async () => {
      if (note) await refreshNoteBody(note)
    },
    refreshKey: note ? `note:${note.id}:${note.lang}` : `note:${nid}:${locale}`,
  })

  useEffect(() => {
    if (!updatesEnabled) return
    let cancelled = false
    const load = async () => {
      if (note?.hasPassword || note?.contentFormat === 'markdown') return
      if (note && !bodyIsStale(note)) {
        if (decorationIsStale(note)) void refreshNoteBody(note)
        return
      }
      try {
        if (note) {
          await refreshNoteBody(note)
        } else {
          const {
            data: detail,
            enrichments,
            meta,
          } = await api.noteDetail(nid, locale)
          await db
            .insert(notes)
            .values({
              ...calibrateNoteMeta(undefined, noteMetaFromApi(detail, locale)),
              ...noteBodyFromApi(detail, enrichments, meta),
            })
            .onConflictDoUpdate({
              target: [notes.id, notes.lang],
              set: noteBodyConflictSet,
            })
        }
      } catch {
        if (!cancelled) setFailed(true)
      }
    }
    setFailed(false)
    void load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId, bodyVersion, nid, locale, attempt, updatesEnabled])

  useEffect(() => {
    if (updatesEnabled && openOnWeb) void openExternalUrl(webUrl)
  }, [openOnWeb, updatesEnabled, webUrl])

  const body =
    note?.contentFormat === 'lexical' && note.content ? note.content : null
  const headings = useMemo(() => extractHeadings(body ?? ''), [body])

  const { marks, onScrollMetrics } = useReadingPresence({
    articleId: note?.id,
    enabled: updatesEnabled,
    openOnWeb,
  })
  const { headerTitleProgress, headerOptions, onScroll, onTitleLayout } =
    useCollapsingTitle(note?.title, tt('notes'), onScrollMetrics, marks)
  const tts = useTtsSession({
    articleId: note?.id,
    available: note?.articleMeta?.tts?.available === true,
    lang: locale,
    stale: note?.articleMeta?.tts?.stale === true,
    title: note?.title,
  })

  const metaParts = note
    ? [
        formatRelativeTime(note.createdAt, locale),
        note.mood,
        note.weather,
        note.likeCount > 0 ? `♡ ${note.likeCount}` : null,
      ]
    : []

  return (
    <View style={[styles.screen, { backgroundColor: palette.surface.desk }]}>
      {printHost}
      <Stack.Screen options={headerOptions} />
      <ArticleMore
        listenAvailable={tts.available}
        listening={tts.isNarrating}
        printAvailable={Boolean(body) && !isLocked}
        title={note?.title}
        tocAvailable={headings.length > 0}
        url={webUrl}
        onListen={tts.start}
        onPrint={
          note && body
            ? () =>
                print({
                  category: tt('notes'),
                  content: body,
                  createdAt: new Date(note.createdAt),
                  siteName: owner?.name || tp('site'),
                  title: note.title,
                  url: webUrl,
                  variant: 'note',
                })
            : undefined
        }
        onToc={() => {
          presentArticleToc(headings, Dimensions.get('window').height)
          router.push(tocHref())
        }}
      />
      {note ? (
        <CommentComposeHost
          refId={note.id}
          refType="note"
          scrollRef={scrollRef}
        >
          {(compose) => (
            <>
              <YohakuStretchCoverHost
                stretchCoverHeight={noteDetailCoverHeight(headerHeight)}
                stretchCoverPlaceholderUri={coverPlaceholderUri}
                stretchCoverUri={coverUrl}
                style={styles.screen}
                stretchCoverAnchorY={
                  coverUrl ? noteDetailCoverAnchorY(headerHeight) : 0
                }
              >
                <EdgeEffectScrollView
                  automaticallyAdjustKeyboardInsets={!compose.composing}
                  headerTitleProgress={headerTitleProgress}
                  ref={scrollRef}
                  style={[styles.screen, styles.scrollClear]}
                  contentContainerStyle={[
                    styles.content,
                    coverUrl ? styles.contentWithCover : null,
                    tts.isNarrating && !compose.composing
                      ? styles.narratingPad
                      : null,
                  ]}
                  contentInset={
                    compose.composing
                      ? { bottom: compose.scrollBottomInset }
                      : undefined
                  }
                  onScroll={onScroll}
                  onScrollBeginDrag={tts.onScrollBeginDrag}
                >
                  {coverUrl ? (
                    <NoteCoverBleed headerHeight={headerHeight} />
                  ) : null}
                  <View style={styles.header} onLayout={onTitleLayout}>
                    <AppText variant="largeTitle">{note.title}</AppText>
                    <ArticleMetaLine
                      aiGen={note.articleMeta?.aiGen}
                      parts={metaParts}
                    />
                  </View>
                  <ArticleNotice
                    id={note.id}
                    kind="note"
                    meta={note.articleMeta}
                    webUrl={webUrl}
                    listen={{
                      available: tts.available,
                      current: tts.current,
                      elapsed: tts.elapsed,
                      status: tts.status,
                      total: tts.total,
                      onToggle: tts.toggle,
                    }}
                  />
                  {isLocked ? (
                    <View style={{ minHeight: reservedBodyHeight, gap: 8 }}>
                      <AppText style={styles.placeholder} variant="secondary">
                        {t('passwordProtected')}
                      </AppText>
                      <AppText
                        style={styles.lockedHint}
                        variant="secondary"
                        onPress={() => void openExternalUrl(webUrl)}
                      >
                        {t('passwordHint')}
                      </AppText>
                    </View>
                  ) : isMarkdown ? (
                    <View style={{ minHeight: reservedBodyHeight }}>
                      <AppText
                        style={styles.placeholder}
                        variant="secondary"
                        onPress={() => void openExternalUrl(webUrl)}
                      >
                        {tc('openInBrowser')}
                      </AppText>
                    </View>
                  ) : body ? (
                    <ArticleBody
                      autoFollow={tts.autoFollow}
                      content={body}
                      enrichments={note?.enrichments ?? null}
                      highlightBlockId={tts.activeBlockId}
                      queriesEnabled={updatesEnabled}
                      refId={note.id}
                      refType="note"
                      scrollRef={scrollRef}
                      variant="note"
                      webUrl={webUrl}
                    />
                  ) : failed ? (
                    <View style={{ minHeight: reservedBodyHeight }}>
                      <AppText
                        style={styles.placeholder}
                        variant="secondary"
                        onPress={() => setAttempt((n) => n + 1)}
                      >
                        {t('bodyFailed')}
                      </AppText>
                    </View>
                  ) : (
                    <BodyLoadingIndicator minHeight={reservedBodyHeight} />
                  )}
                  <NoteTopicBlock topic={topic ?? null} />
                  <ArticleTail
                    kind="note"
                    likeCount={note.likeCount}
                    queriesEnabled={updatesEnabled}
                    refId={note.id}
                    title={note.title}
                    url={webUrl}
                  />
                </EdgeEffectScrollView>
              </YohakuStretchCoverHost>
              {tts.isNarrating && !compose.composing ? (
                <TtsMiniBar
                  autoFollow={tts.autoFollow}
                  current={tts.current}
                  duration={tts.duration}
                  elapsed={tts.elapsed}
                  playbackRate={tts.playbackRate}
                  stale={tts.stale}
                  status={tts.status}
                  total={tts.total}
                  onRecenter={tts.recenter}
                  onSelectRate={tts.setRate}
                  onStop={tts.stop}
                  onToggle={tts.toggle}
                />
              ) : null}
            </>
          )}
        </CommentComposeHost>
      ) : (
        <EdgeEffectScrollView
          contentContainerStyle={styles.content}
          headerTitleProgress={headerTitleProgress}
          ref={scrollRef}
          style={[styles.screen, { backgroundColor: palette.surface.desk }]}
          onScroll={onScroll}
        >
          <AppText style={styles.placeholder} variant="secondary">
            {failed ? t('noteFailed') : tc('loading')}
          </AppText>
        </EdgeEffectScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollClear: {
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 48,
    gap: 20,
  },
  contentWithCover: {
    paddingTop: 0,
  },
  narratingPad: {
    paddingBottom: 108,
  },
  header: {
    gap: 8,
  },
  placeholder: {
    marginTop: 32,
    textAlign: 'center',
  },
  lockedHint: {
    textAlign: 'center',
  },
})
