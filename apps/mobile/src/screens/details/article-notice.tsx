import { useRouter } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import { StyleSheet, View } from 'react-native'

import type { ArticleNoticeMeta, ArticleRelatedRef } from '@/api/article-meta'
import type { NoticeCardRow } from '@/components/ui'
import {
  AppText,
  NOTICE_ICON_COL,
  NoticeCard,
  SinkPressable,
} from '@/components/ui'
import { isLocale, useTranslations } from '@/i18n'
import { usePalette } from '@/theme/palette'

import type { ArticleAiListen } from './article-ai-fold'
import { ArticleAiFold } from './article-ai-fold'
import {
  shouldShowAiRow,
  shouldShowArticleNotice,
} from './article-notice-model'

type RelatedRoute =
  | {
      pathname: '/notes/[nid]'
      params: { nid: string }
    }
  | {
      pathname: '/posts/[category]/[slug]'
      params: { category: string; postId: string; slug: string }
    }

function routeFor(ref: ArticleRelatedRef): RelatedRoute | null {
  if (ref.categorySlug && ref.slug) {
    return {
      pathname: '/posts/[category]/[slug]',
      params: { category: ref.categorySlug, postId: ref.id, slug: ref.slug },
    }
  }
  if (ref.nid !== null) {
    return { pathname: '/notes/[nid]', params: { nid: String(ref.nid) } }
  }
  return null
}

export function ArticleNotice({
  kind,
  id,
  listen,
  meta,
  webUrl,
}: {
  id: string
  kind: 'note' | 'post'
  listen?: ArticleAiListen
  meta: ArticleNoticeMeta | null
  webUrl?: string
}) {
  const t = useTranslations('notice')
  const tl = useTranslations('language')
  const palette = usePalette()
  const router = useRouter()
  const listenAvailable = listen?.available === true

  if (!shouldShowArticleNotice(meta, listenAvailable)) return null
  const related = meta?.related ?? []
  const translation = meta?.translation

  const linkable = related
    .map((ref) => ({ ref, route: routeFor(ref) }))
    .filter(
      (entry): entry is { ref: ArticleRelatedRef; route: RelatedRoute } =>
        entry.route !== null,
    )

  const rows: NoticeCardRow[] = []

  if (translation) {
    const language = isLocale(translation.sourceLang)
      ? tl(translation.sourceLang)
      : (translation.sourceLang ?? '')
    rows.push({
      key: 'translation',
      node: (
        <View style={styles.head}>
          <View style={styles.icon}>
            <SymbolView name="globe" size={14} tintColor={palette.neutral[6]} />
          </View>
          <AppText color={palette.neutral[7]} variant="meta">
            {t('translatedFrom', { language })}
          </AppText>
        </View>
      ),
    })
  }

  if (linkable.length > 0) {
    rows.push({
      key: 'related',
      node: (
        <>
          <View style={styles.head}>
            <View style={styles.icon}>
              <SymbolView name="link" size={14} tintColor={palette.neutral[6]} />
            </View>
            <AppText color={palette.neutral[6]} variant="meta">
              {t('related')}
            </AppText>
          </View>
          <View style={styles.relatedList}>
            {linkable.map(({ ref, route }) => (
              <SinkPressable
                haptic={false}
                key={ref.id}
                style={styles.relatedItem}
                onPress={() => router.push(route)}
              >
                <SymbolView
                  name="arrow.turn.down.right"
                  size={13}
                  style={styles.turn}
                  tintColor={palette.neutral[5]}
                />
                <AppText
                  color={palette.neutral[8]}
                  style={styles.relatedTitle}
                  variant="secondary"
                >
                  {ref.title}
                </AppText>
              </SinkPressable>
            ))}
          </View>
        </>
      ),
    })
  }

  if (shouldShowAiRow(meta, listenAvailable)) {
    rows.push({
      key: 'ai',
      node: (
        <ArticleAiFold
          id={id}
          kind={kind}
          listen={listen}
          meta={meta}
          webUrl={webUrl}
        />
      ),
    })
  }

  return <NoticeCard rows={rows} />
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minWidth: 0,
  },
  icon: {
    width: NOTICE_ICON_COL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  relatedList: {
    gap: 8,
  },
  relatedItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  turn: {
    marginTop: 3,
  },
  relatedTitle: {
    flex: 1,
  },
})
