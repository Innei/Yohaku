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
  buildPrintMasthead,
  formatPrintDate,
  printJobName,
  type PrintMasthead,
} from './article-print'

const DomWebViewModule = requireNativeModule<{
  exportTargetWebViewToPDF: (siteName: string, jobName: string) => Promise<string>
  printTargetWebView: (siteName: string, jobName: string) => Promise<void>
}>('ExpoDomWebViewModule')

export interface ArticlePrintJob {
  category: string
  content: string
  createdAt: Date
  exportPdf?: boolean
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
    const name = printJobName(job.title, job.siteName)
    const exportPdf = DomWebViewModule.exportTargetWebViewToPDF
    const print = DomWebViewModule.printTargetWebView
    try {
      if (job.exportPdf) {
        if (typeof exportPdf !== 'function') return false
        const path = await exportPdf(job.siteName, name)
        return Boolean(path)
      }
      if (typeof print !== 'function') return false
      await print(job.siteName, name)
    } finally {
      onDone()
    }
    return true
  }, [job.exportPdf, job.siteName, job.title, onDone])

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
