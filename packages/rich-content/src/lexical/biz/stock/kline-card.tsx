'use client'
import { sx } from '../../../lib/sx'
import { atoms } from '../../../styles/atoms.stylex'

import type {
  CandlestickData,
  IChartApi,
  ISeriesApi,
  LineData,
  TickMarkType,
  Time,
  UTCTimestamp,
} from 'lightweight-charts'
import { useEffect, useMemo, useRef, useState } from 'react'
import { SlotText } from 'slot-text/react'

import {
  DOWN_COLOR_DARK,
  DOWN_COLOR_LIGHT,
  EMA_FAST_DARK,
  EMA_FAST_LIGHT,
  EMA_SLOW_DARK,
  EMA_SLOW_LIGHT,
  KLINE_BODY_HEIGHT,
  Range52W,
  StockFooter,
  StockFrame,
  StockMasthead,
  StockStatGrid,
  UP_COLOR_DARK,
  UP_COLOR_LIGHT,
} from './shared'
import type { Bar, StockKLineInterval, StockMeta } from './types'

type Props = {
  meta: StockMeta
  bars: Bar[]
  interval: StockKLineInterval
  rangeLabel: string
  emaPeriods?: [number, number] | false
  avatarUrl?: string
  isDark: boolean
  locale?: string
}

const LIGHT_TEXT = 'rgba(0,0,0,0.46)'
const DARK_TEXT = 'rgba(255,255,255,0.5)'
const LIGHT_CROSS = 'rgba(0,0,0,0.32)'
const DARK_CROSS = 'rgba(255,255,255,0.38)'
const LIGHT_LABEL_BG = 'rgba(0,0,0,0.72)'
const DARK_LABEL_BG = 'rgba(255,255,255,0.78)'

export function intlLocale(locale: string | undefined): string | undefined {
  if (locale === 'zh') return 'zh-CN'
  return locale
}

function intervalLabel(interval: StockKLineInterval): string {
  switch (interval) {
    case '5m': {
      return '5m'
    }
    case '15m': {
      return '15m'
    }
    case '1h': {
      return '1h'
    }
    case '1d': {
      return '1d'
    }
  }
}

function toCandleData(bars: Bar[]): CandlestickData<UTCTimestamp>[] {
  return bars.map((b) => ({
    time: Math.floor(b.timestamp / 1000) as UTCTimestamp,
    open: b.open,
    high: b.high,
    low: b.low,
    close: b.close,
  }))
}

function emaSeries(bars: Bar[], period: number): LineData<UTCTimestamp>[] {
  if (period <= 0 || bars.length === 0) return []
  const k = 2 / (period + 1)
  const out: LineData<UTCTimestamp>[] = []
  let prev: number | null = null
  for (const b of bars) {
    const value: number = prev === null ? b.close : b.close * k + prev * (1 - k)
    prev = value
    out.push({
      time: Math.floor(b.timestamp / 1000) as UTCTimestamp,
      value,
    })
  }
  return out
}

function formatCompact(n: number, locale: string | undefined): string {
  try {
    return new Intl.NumberFormat(intlLocale(locale), {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(n)
  } catch {
    return String(Math.round(n))
  }
}

export function KLineCard(props: Props) {
  const {
    meta,
    bars,
    interval,
    rangeLabel,
    emaPeriods = [5, 20],
    avatarUrl,
    isDark,
    locale,
  } = props

  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)
  const barIndexRef = useRef<Map<number, Bar>>(new Map())
  const [hoveredBar, setHoveredBar] = useState<Bar | null>(null)

  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat(intlLocale(locale), {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [locale],
  )

  const formatNumber = (n: number | undefined | null): string => {
    if (n == null || !Number.isFinite(n)) return '—'
    return numberFormatter.format(n)
  }

  const tickFormatters = useMemo(() => {
    const tag = intlLocale(locale)
    return {
      day: new Intl.DateTimeFormat(tag, { month: 'short', day: '2-digit' }),
      month: new Intl.DateTimeFormat(tag, { month: 'short' }),
      year: new Intl.DateTimeFormat(tag, { year: 'numeric' }),
      time: new Intl.DateTimeFormat(tag, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
      hoverStamp: new Intl.DateTimeFormat(tag, {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    }
  }, [locale])

  useEffect(() => {
    const map = new Map<number, Bar>()
    for (const b of bars) {
      map.set(Math.floor(b.timestamp / 1000), b)
    }
    barIndexRef.current = map
  }, [bars])

  useEffect(() => {
    const el = containerRef.current
    if (!el || bars.length === 0) return

    let cancelled = false
    void (async () => {
      const {
        createChart,
        CandlestickSeries,
        LineSeries,
        CrosshairMode,
        LineStyle,
      } = await import('lightweight-charts')
      if (cancelled) return

      const textColor = isDark ? DARK_TEXT : LIGHT_TEXT
      const crossColor = isDark ? DARK_CROSS : LIGHT_CROSS
      const labelBg = isDark ? DARK_LABEL_BG : LIGHT_LABEL_BG
      const upColor = isDark ? UP_COLOR_DARK : UP_COLOR_LIGHT
      const downColor = isDark ? DOWN_COLOR_DARK : DOWN_COLOR_LIGHT
      const emaFastColor = isDark ? EMA_FAST_DARK : EMA_FAST_LIGHT
      const emaSlowColor = isDark ? EMA_SLOW_DARK : EMA_SLOW_LIGHT

      const chart = createChart(el, {
        autoSize: true,
        layout: {
          background: { color: 'transparent' },
          textColor,
          fontSize: 10,
          attributionLogo: false,
        },
        grid: {
          vertLines: { visible: false },
          horzLines: { visible: false },
        },
        rightPriceScale: {
          borderVisible: false,
          scaleMargins: { top: 0.12, bottom: 0.12 },
        },
        timeScale: {
          borderVisible: false,
          rightOffset: 1,
          fixLeftEdge: true,
          fixRightEdge: true,
          lockVisibleTimeRangeOnResize: true,
          tickMarkFormatter: (time: Time, tickMarkType: TickMarkType) => {
            const ts = typeof time === 'number' ? (time as number) : 0
            const d = new Date(ts * 1000)
            switch (tickMarkType) {
              case 0: {
                return tickFormatters.year.format(d)
              }
              case 1: {
                return tickFormatters.month.format(d)
              }
              case 2: {
                return tickFormatters.day.format(d)
              }
              default: {
                return tickFormatters.time.format(d)
              }
            }
          },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: {
            width: 1,
            color: crossColor,
            style: LineStyle.Dashed,
            labelBackgroundColor: labelBg,
          },
          horzLine: {
            width: 1,
            color: crossColor,
            style: LineStyle.Dashed,
            labelBackgroundColor: labelBg,
          },
        },
        localization: {
          locale: intlLocale(locale) ?? navigator.language,
          priceFormatter: (price: number) => numberFormatter.format(price),
        },
        handleScroll: false,
        handleScale: false,
      })
      chartRef.current = chart

      const series = chart.addSeries(CandlestickSeries, {
        upColor: 'transparent',
        downColor,
        borderUpColor: upColor,
        borderDownColor: downColor,
        wickUpColor: upColor,
        wickDownColor: downColor,
        borderVisible: true,
        priceLineVisible: false,
        lastValueVisible: false,
        priceFormat: {
          type: 'price',
          precision: 2,
          minMove: 0.01,
        },
      })
      seriesRef.current = series
      series.setData(toCandleData(bars))

      if (emaPeriods) {
        const [fast, slow] = emaPeriods
        const fastSeries = chart.addSeries(LineSeries, {
          color: emaFastColor,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        })
        fastSeries.setData(emaSeries(bars, fast))
        const slowSeries = chart.addSeries(LineSeries, {
          color: emaSlowColor,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        })
        slowSeries.setData(emaSeries(bars, slow))
      }

      chart.timeScale().fitContent()

      const crosshairHandler = (param: {
        time?: unknown
        seriesData: Map<ISeriesApi<'Candlestick'>, unknown>
      }) => {
        const s = seriesRef.current
        if (!param.time || !s) {
          setHoveredBar(null)
          return
        }
        const time =
          typeof param.time === 'number' ? (param.time as number) : NaN
        if (!Number.isFinite(time)) {
          setHoveredBar(null)
          return
        }
        const orig = barIndexRef.current.get(time)
        if (orig) {
          setHoveredBar(orig)
          return
        }
        const d = param.seriesData.get(s) as
          CandlestickData<UTCTimestamp> | undefined
        if (!d) {
          setHoveredBar(null)
          return
        }
        setHoveredBar({
          timestamp: time * 1000,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        })
      }
      chart.subscribeCrosshairMove(crosshairHandler as never)

      const leaveHandler = () => setHoveredBar(null)
      el.addEventListener('mouseleave', leaveHandler)

      cleanupRef.current = () => {
        el.removeEventListener('mouseleave', leaveHandler)
        chart.unsubscribeCrosshairMove(crosshairHandler as never)
        chart.remove()
      }
    })()

    return () => {
      cancelled = true
      cleanupRef.current?.()
      cleanupRef.current = null
      chartRef.current = null
      seriesRef.current = null
    }
  }, [bars, emaPeriods, isDark, locale, numberFormatter, tickFormatters])

  const lastBar = bars.at(-1)
  const displayBar = hoveredBar ?? lastBar
  const displayedPrice = displayBar?.close ?? meta.regularMarketPrice
  const previousClose = meta.chartPreviousClose ?? bars[0]?.open
  const delta =
    displayedPrice != null && previousClose != null
      ? displayedPrice - previousClose
      : 0
  const deltaPct =
    displayedPrice != null && previousClose ? (delta / previousClose) * 100 : 0
  const isUp = delta >= 0

  const stamp = hoveredBar
    ? tickFormatters.hoverStamp.format(new Date(hoveredBar.timestamp))
    : null

  const week52Low = meta.fiftyTwoWeekLow
  const week52High = meta.fiftyTwoWeekHigh
  const has52W =
    week52Low != null &&
    week52High != null &&
    week52High > week52Low &&
    displayedPrice != null

  return (
    <StockFrame>
      <StockMasthead
        avatarUrl={avatarUrl}
        delta={formatNumber(delta)}
        deltaPct={formatNumber(deltaPct)}
        displayPrice={formatNumber(displayedPrice)}
        isUp={isUp}
        meta={meta}
        stats={
          <StockStatGrid
            items={[
              {
                label: 'OPEN',
                value: <SlotText text={formatNumber(displayBar?.open)} />,
              },
              {
                label: 'HIGH',
                value: <SlotText text={formatNumber(displayBar?.high)} />,
              },
              {
                label: 'LOW',
                value: <SlotText text={formatNumber(displayBar?.low)} />,
              },
              {
                label: 'VOL',
                value: (
                  <SlotText
                    text={
                      displayBar?.volume
                        ? formatCompact(displayBar.volume, locale)
                        : '—'
                    }
                  />
                ),
              },
            ]}
          >
            {has52W ? (
              <Range52W
                formatter={numberFormatter}
                high={week52High}
                low={week52Low}
                value={displayedPrice}
              />
            ) : null}
          </StockStatGrid>
        }
      />

      <div
        {...sx(atoms.mt_4, atoms.w_full)}
        ref={containerRef}
        style={{ height: KLINE_BODY_HEIGHT }}
      />

      <StockFooter
        right={<SlotText text={stamp ?? rangeLabel} />}
        left={
          <>
            {intervalLabel(interval)} · {bars.length}{' '}
            {bars.length === 1 ? 'bar' : 'bars'}
            {emaPeriods ? ` · EMA ${emaPeriods[0]}/${emaPeriods[1]}` : ''}
          </>
        }
      />
    </StockFrame>
  )
}
