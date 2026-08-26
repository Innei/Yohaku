import { requireNativeModule } from 'expo-modules-core'
import { useCallback, useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { apiBaseUrl } from '@/api/base-url'
import RichBody from '@/components/dom/rich-body'
import { useRichBodyLabels } from '@/components/dom/use-rich-body-labels'
import { useLocale } from '@/i18n'
import { getSiteUrl } from '@/lib/site-url'
import { useWebviewSerifFontFamily } from '@/theme/serif-font'
import { useWebviewFontFaces } from '@/theme/webview-fonts'

import {
  type PrintMasthead,
  buildPrintMasthead,
  formatPrintDate,
} from './article-print'

const DomWebViewModule = requireNativeModule<{
  printTargetWebView: (siteName: string) => Promise<void>
}>('ExpoDomWebViewModule')

export interface ArticlePrintJob {
  category: string
  content: string
  createdAt: Date
  siteName: string
  title: string
  url: string
  variant: 'article' | 'note'
}

export function useArticlePrint() {
  const [job, setJob] = useState<ArticlePrintJob | null>(null)
  return {
    host: job ? (
      <ArticlePrintHost job={job} onDone={() => setJob(null)} />
    ) : null,
    print: setJob,
  }
}

function ArticlePrintHost({
  job,
  onDone,
}: {
  job: ArticlePrintJob
  onDone: () => void
}) {
  const locale = useLocale()
  const labels = useRichBodyLabels()
  const fontFaces = useWebviewFontFaces()
  const serifFontFamily = useWebviewSerifFontFamily()
  const masthead: PrintMasthead = buildPrintMasthead({
    category: job.category,
    dateLabel: formatPrintDate(job.createdAt, locale),
    title: job.title,
    url: job.url,
  })

  const handlePrintReady = useCallback(async () => {
    const print = DomWebViewModule.printTargetWebView
    if (typeof print !== 'function') return false
    try {
      await print(job.siteName)
    } finally {
      onDone()
    }
    return true
  }, [job.siteName, onDone])

  return (
    <View pointerEvents="none" style={styles.offscreen}>
      <RichBody
        apiBase={apiBaseUrl()}
        content={job.content}
        fontFaces={fontFaces}
        labels={labels}
        locale={locale}
        printDocument={masthead}
        serifFontFamily={serifFontFamily}
        theme="light"
        variant={job.variant}
        webUrl={job.url}
        dom={{
          contentInsetAdjustmentBehavior: 'never',
          matchContents: false,
          pooled: false,
          printTarget: true,
          scrollEnabled: false,
          siteReferer: getSiteUrl(),
        }}
        onImagePress={async () => {}}
        onLinkPress={async () => {}}
        onPrintReady={handlePrintReady}
        onScrollToAnchor={async () => {}}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  offscreen: {
    height: 1056,
    left: -2000,
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
    width: 680,
    zIndex: -1,
  },
})
