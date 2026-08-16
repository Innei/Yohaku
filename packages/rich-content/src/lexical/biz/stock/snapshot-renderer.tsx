'use client'

import { useId, useState } from 'react'
import { SlotText } from 'slot-text/react'

import { HostFetchError, useHost } from '../../../host'
import { useResource } from '../../../lib/use-resource'
import {
  DOWN_COLOR_DARK,
  DOWN_COLOR_LIGHT,
  Range52W,
  RetryMessage,
  SNAPSHOT_BODY_HEIGHT,
  StockFooter,
  StockFrame,
  StockMasthead,
  StockSnapshotSkeleton,
  StockStatGrid,
  UP_COLOR_DARK,
  UP_COLOR_LIGHT,
} from './shared'
import type { Quote, SparklinePoint, StockMeta } from './types'

const SPARK_W = 260
const SPARK_H = SNAPSHOT_BODY_HEIGHT
const SPARK_PAD_Y = 6

function buildSparkPaths(points: SparklinePoint[]): {
  line: string
  area: string
  endX: number
  endY: number
} {
  if (points.length === 0) return { line: '', area: '', endX: 0, endY: SPARK_H }
  const closes = points.map((p) => p.close)
  const min = Math.min(...closes)
  const max = Math.max(...closes)
  const range = max - min || 1
  const innerH = SPARK_H - SPARK_PAD_Y * 2
  const xs = points.map((_, i) =>
    points.length > 1 ? (i / (points.length - 1)) * SPARK_W : SPARK_W / 2,
  )
  const ys = closes.map((c) => SPARK_PAD_Y + ((max - c) / range) * innerH)
  const pts = xs.map((x, i) => ({ x, y: ys[i] }))
  if (pts.length === 1) {
    return {
      line: `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`,
      area: '',
      endX: pts[0].x,
      endY: pts[0].y,
    }
  }
  const segs: string[] = [`M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`]
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    segs.push(
      `C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
    )
  }
  const line = segs.join(' ')
  const last = pts.at(-1)!
  const first = pts[0]
  const area = `${line} L ${last.x.toFixed(2)} ${SPARK_H} L ${first.x.toFixed(2)} ${SPARK_H} Z`
  return { line, area, endX: last.x, endY: last.y }
}

function formatCompact(n: number): string {
  try {
    return new Intl.NumberFormat(undefined, {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(n)
  } catch {
    return String(Math.round(n))
  }
}

function formatRange(
  low: number,
  high: number,
  formatter: Intl.NumberFormat,
): string {
  return `${formatter.format(low)} – ${formatter.format(high)}`
}

export function SnapshotCard({ quote }: { quote: Quote }) {
  const isDark = useHost().theme === 'dark'
  const gradientId = useId()

  const nf = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const deltaSigned = quote.price - quote.previousClose
  const deltaPctSigned =
    quote.previousClose > 0 ? (deltaSigned / quote.previousClose) * 100 : 0
  const isUp = deltaSigned >= 0
  const displayPrice = nf.format(quote.price)
  const delta = nf.format(Math.abs(deltaSigned))
  const deltaPct = nf.format(Math.abs(deltaPctSigned))

  const meta: StockMeta = {
    symbol: quote.symbol,
    exchange: quote.exchange,
    longName: quote.longName,
    shortName: quote.shortName,
    currency: quote.currency,
  }

  const firstClose = quote.sparkline[0]?.close ?? 0
  const lastClose = quote.sparkline.at(-1)?.close ?? firstClose
  const sparkUp = lastClose >= firstClose
  const strokeColor = sparkUp
    ? isDark
      ? UP_COLOR_DARK
      : UP_COLOR_LIGHT
    : isDark
      ? DOWN_COLOR_DARK
      : DOWN_COLOR_LIGHT
  const { line, area, endX, endY } = buildSparkPaths(quote.sparkline)

  const tf = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
    hour12: false,
  })
  const asOfText = tf.format(new Date(quote.asOf * 1000))

  const has52W = quote.fiftyTwoWeekHigh > quote.fiftyTwoWeekLow

  return (
    <StockFrame>
      <StockMasthead
        delta={delta}
        deltaPct={deltaPct}
        displayPrice={displayPrice}
        isUp={isUp}
        marketState={quote.marketState}
        meta={meta}
        stats={
          <StockStatGrid
            items={[
              {
                label: 'DAY',
                span: 2,
                value: (
                  <SlotText
                    text={formatRange(quote.dayLow, quote.dayHigh, nf)}
                  />
                ),
              },
              {
                label: 'VOL',
                value: (
                  <SlotText
                    text={quote.volume ? formatCompact(quote.volume) : '—'}
                  />
                ),
              },
              {
                label: 'PREV',
                value: <SlotText text={nf.format(quote.previousClose)} />,
              },
            ]}
          >
            {has52W ? (
              <Range52W
                formatter={nf}
                high={quote.fiftyTwoWeekHigh}
                low={quote.fiftyTwoWeekLow}
                value={quote.price}
              />
            ) : null}
          </StockStatGrid>
        }
      />

      <div className="relative mt-4 w-full" style={{ height: SPARK_H }}>
        <svg
          aria-hidden="true"
          height={SPARK_H}
          preserveAspectRatio="none"
          style={{ display: 'block', width: '100%', height: SPARK_H }}
          viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.18} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          {area ? <path d={area} fill={`url(#${gradientId})`} /> : null}
          {line ? (
            <path
              d={line}
              fill="none"
              stroke={strokeColor}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.2}
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </svg>
        {line ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute block rounded-full"
            style={{
              left: `${(endX / SPARK_W) * 100}%`,
              top: `${(endY / SPARK_H) * 100}%`,
              width: 5,
              height: 5,
              marginLeft: -2.5,
              marginTop: -2.5,
              background: strokeColor,
            }}
          />
        ) : null}
      </div>

      <StockFooter left="Today · intraday" right={`as of ${asOfText}`} />
    </StockFrame>
  )
}

export function StockSnapshotRenderer({ symbol }: { symbol: string }) {
  const host = useHost()
  const [retryNonce, setRetryNonce] = useState(0)
  const { data, error } = useResource(
    `stock-quote:${symbol}:${retryNonce}`,
    () =>
      host.fetchJSON<Quote>(
        `/serverless/built-in/stock_quote?symbol=${encodeURIComponent(symbol)}`,
      ),
  )

  if (data) return <SnapshotCard quote={data} />
  if (error) {
    const notFound = error instanceof HostFetchError && error.status === 404
    if (notFound) {
      return (
        <StockSnapshotSkeleton message="Symbol not found" symbol={symbol} />
      )
    }
    return (
      <StockSnapshotSkeleton
        symbol={symbol}
        message={
          <RetryMessage
            label="Failed to load quote"
            onRetry={() => setRetryNonce((n) => n + 1)}
          />
        }
      />
    )
  }
  return <StockSnapshotSkeleton symbol={symbol} />
}
