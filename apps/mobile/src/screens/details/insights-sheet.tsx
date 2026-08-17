import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { StyleSheet, View } from 'react-native'

import { apiBaseUrl } from '@/api/base-url'
import { api } from '@/api/client'
import InsightsBody from '@/components/dom/insights-body'
import { useRouteTransitionSettled } from '@/components/navigation/use-route-transition-settled'
import { AppText } from '@/components/ui'
import { useLocale, useTranslations } from '@/i18n'
import { presentImagePreview } from '@/lib/image-cache'
import {
  extractInsightsMeta,
  formatInsightsMetaLine,
  insightsWebViewDom,
} from '@/lib/insights-meta'
import { hrefForExternalUrl } from '@/lib/link-router'
import { getSiteUrl } from '@/lib/site-url'
import { usePalette } from '@/theme/palette'
import { useWebviewFontFaces } from '@/theme/webview-fonts'

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
  const router = useRouter()
  const fontFaces = useWebviewFontFaces()
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

  if (!markdown.trim()) {
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
    <View style={[styles.sheet, { backgroundColor: palette.surface.desk }]}>
      <InsightsBody
        apiBase={apiBaseUrl()}
        background={palette.surface.desk}
        fontFaces={fontFaces}
        headerInset={56}
        labels={{ missing: t('insightsMissing') }}
        locale={locale}
        markdown={markdown}
        theme={palette.theme}
        variant={kind}
        webOrigin={getSiteUrl()}
        dom={insightsWebViewDom({
          meta: metaLine,
          metaColor: palette.neutral[7],
          title: t('aiInsights'),
          titleColor: palette.neutral[9],
        })}
        onImagePress={async ({ images, index, src }) => {
          const urls = images.length > 0 ? images : src ? [src] : []
          if (urls.length === 0) return
          await presentImagePreview({
            index: Math.max(0, index),
            urls,
          })
        }}
        onLinkPress={async (url) => {
          const href = hrefForExternalUrl(url)
          if (href) {
            router.push(href)
          } else {
            await WebBrowser.openBrowserAsync(url)
          }
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
  },
  status: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
})
