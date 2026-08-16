'use client'

import { useEffect, useMemo, useState } from 'react'

import { HostFetchError, useHost } from '../../../host'
import { intlLocale, KLineCard } from './kline-card'
import { RetryMessage, StockKLineSkeleton } from './shared'
import type { BarsResult, StockKLineInterval } from './types'

type StockKLineRange = {
  from: string
  to: string
  interval: StockKLineInterval
}

type Props = {
  symbol: string
  range: StockKLineRange
  ema?: [number, number] | false
}

function formatRange(
  from: string,
  to: string,
  locale: string | undefined,
): string {
  const start = new Date(from)
  const end = new Date(to)
  const tag = intlLocale(locale)
  try {
    const fmt = new Intl.DateTimeFormat(tag, {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    })
    const startLabel = fmt.format(start)
    const endLabel = fmt.format(end)
    if (startLabel === endLabel) return startLabel
    if (typeof fmt.formatRange === 'function') {
      return fmt.formatRange(start, end)
    }
    return `${startLabel} – ${endLabel}`
  } catch {
    const startLabel = start.toLocaleDateString()
    const endLabel = end.toLocaleDateString()
    return startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`
  }
}

type FetchState =
  | { status: 'loading' }
  | { status: 'ok'; data: BarsResult }
  | { status: 'error'; kind: 'not-found' | 'transient' }

export function PortableStockKLine({ symbol, range, ema }: Props) {
  const { fetchJSON, locale, theme } = useHost()
  const rangeLabel = useMemo(
    () => formatRange(range.from, range.to, locale),
    [range.from, range.to, locale],
  )
  const [state, setState] = useState<FetchState>({ status: 'loading' })
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })
    const qs = new URLSearchParams({
      symbol,
      interval: range.interval,
      from: range.from,
      to: range.to,
    })
    fetchJSON<BarsResult>(`/serverless/built-in/stock_bars?${qs.toString()}`)
      .then((data) => {
        if (!cancelled) setState({ status: 'ok', data })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setState({
          status: 'error',
          kind:
            error instanceof HostFetchError && error.status === 404
              ? 'not-found'
              : 'transient',
        })
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, range.from, range.to, range.interval, retryKey])

  if (state.status === 'ok') {
    return (
      <KLineCard
        bars={state.data.bars}
        emaPeriods={ema}
        interval={range.interval}
        isDark={theme === 'dark'}
        locale={locale}
        meta={state.data.meta}
        rangeLabel={rangeLabel}
      />
    )
  }
  if (state.status === 'error') {
    if (state.kind === 'not-found') {
      return <StockKLineSkeleton message="Symbol not found" symbol={symbol} />
    }
    return (
      <StockKLineSkeleton
        symbol={symbol}
        message={
          <RetryMessage
            label="Failed to load chart"
            onRetry={() => setRetryKey((k) => k + 1)}
          />
        }
      />
    )
  }
  return <StockKLineSkeleton symbol={symbol} />
}
