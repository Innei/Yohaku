import type { ApiStockBar, ApiStockBars } from '@/api/types'

export interface StockRange {
  from: string
  interval: string
  to: string
}

export interface StockHeader {
  changePct: number
  lastClose: number
  up: boolean
}

export function emaSeries(closes: number[], period: number): number[] {
  if (period <= 0) return []
  const k = 2 / (period + 1)
  const out: number[] = []
  for (const close of closes) {
    const prev = out.at(-1)
    out.push(prev === undefined ? close : close * k + prev * (1 - k))
  }
  return out
}

export function stockHeader(
  meta: ApiStockBars['meta'],
  bars: ApiStockBar[],
): StockHeader | null {
  const last = bars.at(-1)
  const base = bars[0]?.open
  if (!last || !base) return null
  const changePct = ((last.close - base) / base) * 100
  return { changePct, lastClose: last.close, up: changePct >= 0 }
}

function monthDay(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`
}

export function rangeLabel(range: StockRange): string {
  const from = monthDay(new Date(range.from))
  const to = monthDay(new Date(range.to))
  const span = from === to ? from : `${from} – ${to}`
  return `${span} · ${range.interval}`
}
