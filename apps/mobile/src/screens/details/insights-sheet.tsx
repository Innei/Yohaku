import { type as typeScale } from '@yohaku/design-system/tokens'
import { useQuery } from '@tanstack/react-query'
import { SymbolView } from 'expo-symbols'
import { Fragment, useMemo, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'

import { api } from '@/api/client'
import { useRouteTransitionSettled } from '@/components/navigation/use-route-transition-settled'
import { AppText, MarkdownBody } from '@/components/ui'
import { useLocale, useTranslations } from '@/i18n'
import {
  extractInsightsMeta,
  formatInsightsMetaLine,
} from '@/lib/insights-meta'
import { insightsBlocks, parseYohakuRefUrl } from '@/lib/insights-markup'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'

import { InsightsMermaid } from './insights-mermaid'

const INSIGHTS_SIZE = typeScale.copy13.size
const INSIGHTS_LINE = Math.round(INSIGHTS_SIZE * 1.8)

export function InsightsSheet({
  id,
  kind,
}: {
  id: string
  kind: 'note' | 'post'
}) {
  const t = useTranslations('notice')
  const ty = useTranslations('yohaku')
  const palette = usePalette()
  const locale = useLocale()
  const [openRef, setOpenRef] = useState<{
    blockIndex: number
    quote: string
  } | null>(null)
  const queriesEnabled = useRouteTransitionSettled(
    `insights:${locale}:${kind}:${id}`,
  )
  const query = useQuery({
    enabled: queriesEnabled,
    queryFn: () => api.insights(id),
    queryKey: ['insights', id, locale],
  })

  const markdown = query.data?.content ?? ''
  const meta = markdown ? extractInsightsMeta(markdown) : null
  const literary = kind === 'note' && locale.startsWith('zh')
  const metaLine = meta
    ? formatInsightsMetaLine(
        meta,
        (key, vars) => ty(key as never, vars),
        literary,
      )
    : null
  const blocks = useMemo(() => insightsBlocks(markdown), [markdown])

  if (query.isPending) {
    return (
      <AppText
        color={palette.neutral[6]}
        style={[styles.status, { backgroundColor: palette.surface.desk }]}
        variant="secondary"
      >
        {t('insightsLoading')}
      </AppText>
    )
  }

  if (query.isError) {
    return (
      <AppText
        color={palette.neutral[7]}
        style={[styles.status, { backgroundColor: palette.surface.desk }]}
        variant="secondary"
        onPress={() => void query.refetch()}
      >
        {t('insightsFailed')}
      </AppText>
    )
  }

  if (blocks.length === 0) {
    return (
      <AppText
        color={palette.neutral[6]}
        style={[styles.status, { backgroundColor: palette.surface.desk }]}
        variant="secondary"
      >
        {t('insightsMissing')}
      </AppText>
    )
  }

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
          {t('aiInsights')}
        </AppText>
      </View>
      {metaLine ? (
        <AppText color={palette.neutral[7]} variant="meta">
          {metaLine}
        </AppText>
      ) : null}
      {blocks.map((block, blockIndex) =>
        block.type === 'mermaid' ? (
          <InsightsMermaid
            content={block.content}
            // eslint-disable-next-line @eslint-react/no-array-index-key -- blocks derive solely from content
            key={blockIndex}
          />
        ) : (
          <Fragment
            // eslint-disable-next-line @eslint-react/no-array-index-key -- blocks derive solely from content
            key={blockIndex}
          >
            <MarkdownBody
              fontSize={INSIGHTS_SIZE}
              headingColor={palette.accent}
              lineHeight={INSIGHTS_LINE}
              markdown={block.markdown}
              onLinkPress={(url) => {
                const ref = parseYohakuRefUrl(url)
                if (!ref) return false
                setOpenRef((current) =>
                  current?.blockIndex === blockIndex &&
                  current.quote === ref.quote
                    ? null
                    : { blockIndex, quote: ref.quote },
                )
                return true
              }}
            />
            {openRef?.blockIndex === blockIndex && openRef.quote ? (
              <AppText color={palette.neutral[7]} style={styles.quote}>
                {openRef.quote}
              </AppText>
            ) : null}
          </Fragment>
        ),
      )}
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
  quote: {
    fontSize: 12,
    lineHeight: 20,
    marginTop: -6,
  },
  status: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
})
