import { YohakuNative } from '@modules/yohaku'
import { useRef } from 'react'

import { api } from '@/api/client'
import { useLocale } from '@/i18n'
import { renderInsightsMermaid } from '@/lib/insights-mermaid'
import { getSiteUrl } from '@/lib/site-url'
import { afilmorySource, albumTiles } from '@/rich/blocks/afilmory'
import { fetchAlbum } from '@/rich/blocks/afilmory-album'
import { fetchTrack, track } from '@/rich/blocks/map-block'
import { emaSeries } from '@/rich/blocks/stock'
import { emaPeriods, rangeOf } from '@/rich/blocks/stock-block'
import { num, str } from '@/rich/blocks/types'
import { footnoteNumbers } from '@/rich/lexical/footnotes'
import {
  type PrintContext,
  printItems,
  printScaled,
} from '@/rich/print/print-items'
import { useSegmentProbe } from '@/rich/print/segment-probe'
import { richTypography } from '@/rich/typography'
import { palettes } from '@/theme/palette'

import { parseState } from './article-body'
import {
  buildPrintMasthead,
  formatPrintDate,
  printJobName,
} from './article-print'

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

const paper = palettes.light

const ALBUM_LIMIT = 9

type PrintNode = Parameters<PrintContext['fetchTrack']>[0]

async function printTrack(node: PrintNode) {
  const url = track(node)
  if (!url) return null
  return (await fetchTrack(url))?.polylines ?? null
}

async function printKline(node: PrintNode) {
  const symbol = str(node.symbol)
  const range = rangeOf(node)
  if (node.variant !== 'kline' || !symbol || !range) return null
  const { bars } = await api.stockBars({ symbol, ...range })
  const closes = bars.map((bar) => bar.close)
  const colors = [paper.accent, paper.neutral[5]]
  return {
    bars: bars.map((bar) => ({
      c: bar.close,
      h: bar.high,
      l: bar.low,
      o: bar.open,
      t: bar.timestamp,
      v: bar.volume ?? 0,
    })),
    ema: emaPeriods(node)
      .slice(0, colors.length)
      .map((period, index) => ({
        color: colors[index]!,
        period,
        values: emaSeries(closes, period),
      })),
  }
}

async function printAlbum(node: PrintNode) {
  const baseUrl = str(node.baseUrl)
  const source = afilmorySource(node)
  if (!baseUrl || !source) return []
  const cap = Math.min(num(node.limit) ?? ALBUM_LIMIT, ALBUM_LIMIT)
  const { photos } = await fetchAlbum(baseUrl, source, cap)
  return albumTiles(baseUrl, source, photos)
    .slice(0, cap)
    .flatMap((tile) => tile.thumb ?? tile.full ?? [])
}

async function renderPrintMermaid(diagram: string) {
  const rendered = await renderInsightsMermaid(diagram, {
    bg: '#ffffff',
    fg: paper.neutral[9],
  })
  return rendered.src
}

export function useArticlePrint() {
  const locale = useLocale()
  const { probe, probes } = useSegmentProbe()
  const busyRef = useRef(false)

  const print = async (job: ArticlePrintJob) => {
    const value = parseState(job.content)
    if (!value || busyRef.current) return ''
    busyRef.current = true
    try {
      return await runPrint(job, value)
    } finally {
      busyRef.current = false
    }
  }

  const runPrint = async (
    job: ArticlePrintJob,
    value: NonNullable<ReturnType<typeof parseState>>,
  ) => {
    const items = await printItems(await probe(value), {
      fetchAlbum: printAlbum,
      fetchKline: printKline,
      fetchTrack: printTrack,
      footnotes: footnoteNumbers(value),
      locale,
      probe,
      renderMermaid: renderPrintMermaid,
    })
    const masthead = buildPrintMasthead({
      category: job.category,
      dateLabel: formatPrintDate(job.createdAt, locale),
      title: job.title,
      url: job.url,
    })
    return YohakuNative.printRichDocument({
      exportPdf: job.exportPdf,
      items,
      jobName: printJobName(job.title, job.siteName),
      klineColors: {
        down: paper.semantic.error,
        grid: paper.neutral[3],
        label: paper.neutral[6],
        up: paper.semantic.success,
        volume: paper.neutral[4],
      },
      masthead: {
        meta: [masthead.category, masthead.dateLabel]
          .filter(Boolean)
          .join(' · '),
        title: masthead.title,
        url: masthead.url,
      },
      referer: getSiteUrl(),
      siteName: job.siteName,
      typography: printScaled(richTypography(job.variant, locale, paper)),
    })
  }

  return { host: probes, print }
}
