'use client'

import { clsx } from 'clsx'
import type { CSSProperties, ReactNode } from 'react'
import { useState } from 'react'
import { SlotText } from 'slot-text/react'

import { useHost } from '../../../host'
import type { MarketState, StockMeta } from './types'

export const UP_COLOR_LIGHT = '#0F8B45'
export const UP_COLOR_DARK = '#10B981'
export const DOWN_COLOR_LIGHT = '#B91C1C'
export const DOWN_COLOR_DARK = '#EF4444'

export const EMA_FAST_LIGHT = '#1E40AF'
export const EMA_FAST_DARK = '#60A5FA'
export const EMA_SLOW_LIGHT = '#C2410C'
export const EMA_SLOW_DARK = '#FB923C'

export const SNAPSHOT_BODY_HEIGHT = 120
export const KLINE_BODY_HEIGHT = 200

export function StockFrame({
  children,
  className,
  style,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  return (
    <div
      className={clsx(
        'text-neutral-9 font-[system-ui] relative my-8 w-full border-y py-4 tabular-nums',
        className,
      )}
      style={{
        fontFeatureSettings: '"tnum", "ss01"',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function symbolToParqetLogo(symbol: string): string {
  return `https://assets.parqet.com/logos/symbol/${encodeURIComponent(symbol.toUpperCase())}`
}

export function SymbolAvatar({
  symbol,
  avatarUrl,
  size = 13,
}: {
  symbol: string
  avatarUrl?: string
  size?: number
}) {
  const [errored, setErrored] = useState(false)
  const url = avatarUrl ?? symbolToParqetLogo(symbol)

  if (!errored && url) {
    return (
      <img
        alt=""
        className="bg-neutral-2 my-0 flex-shrink-0 rounded-full object-contain p-px"
        height={size}
        loading="lazy"
        src={url}
        width={size}
        onError={() => setErrored(true)}
      />
    )
  }

  const initial = symbol.slice(0, 1).toUpperCase()
  return (
    <span
      aria-hidden="true"
      className="bg-neutral-9 text-neutral-1 inline-flex flex-shrink-0 items-center justify-center rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: Math.max(7, Math.floor(size * 0.45)),
        letterSpacing: 0,
      }}
    >
      {initial}
    </span>
  )
}

const MARKET_STATE_LABEL: Record<MarketState, string> = {
  pre: 'PRE-MKT',
  regular: 'OPEN',
  post: 'POST-MKT',
  closed: 'CLOSED',
}

export function MarketStateDot({ state }: { state: MarketState }) {
  const isLive = state === 'regular'
  const isExt = state === 'pre' || state === 'post'
  const dotClass = isLive
    ? 'bg-[#1F9D55] dark:bg-[#34D399]'
    : isExt
      ? 'bg-[#D97706] dark:bg-[#FBBF24]'
      : 'bg-neutral-6'
  return (
    <span className="inline-flex items-center">
      <span
        aria-hidden="true"
        className={`mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle ${dotClass}`}
      />
      <span>{MARKET_STATE_LABEL[state]}</span>
    </span>
  )
}

export function StockMasthead({
  meta,
  displayPrice,
  delta,
  deltaPct,
  isUp,
  avatarUrl,
  marketState,
  stats,
}: {
  meta: StockMeta
  displayPrice: string
  delta: string
  deltaPct: string
  isUp: boolean
  avatarUrl?: string
  marketState?: MarketState
  stats?: ReactNode
}) {
  const isDark = useHost().theme === 'dark'
  const upText = isDark ? UP_COLOR_DARK : UP_COLOR_LIGHT
  const downText = isDark ? DOWN_COLOR_DARK : DOWN_COLOR_LIGHT

  const exch = meta.exchange?.split(/\s+|·/)[0]
  const displayName = meta.longName ?? meta.shortName ?? meta.symbol
  const arrow = isUp ? '▲' : '▼'
  const deltaAbs = delta.replace(/^-/, '')
  const deltaPctAbs = deltaPct.replace(/^-/, '')

  const metaParts: ReactNode[] = [<span key="sym">{meta.symbol}</span>]
  if (exch) metaParts.push(<span key="exch">{exch}</span>)
  if (meta.currency) metaParts.push(<span key="cur">{meta.currency}</span>)
  if (marketState) {
    metaParts.push(<MarketStateDot key="ms" state={marketState} />)
  }

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
      <div className="min-w-0">
        <div className="text-neutral-7 font-mono text-caption-10 flex flex-wrap items-center gap-x-1.5 tracking-[0.14em] uppercase">
          <SymbolAvatar avatarUrl={avatarUrl} symbol={meta.symbol} />
          {metaParts.map((part, i) => (
            <span className="inline-flex items-center" key={i}>
              {i > 0 ? (
                <span aria-hidden="true" className="text-neutral-6 mr-1.5">
                  ·
                </span>
              ) : null}
              {part}
            </span>
          ))}
        </div>
        <div className="text-neutral-10 font-mono text-display-36 mt-1.5 leading-none tracking-[-0.015em]">
          <SlotText text={displayPrice} />
        </div>
        <div
          className="text-label-12 mt-1.5 font-medium"
          style={{ color: isUp ? upText : downText }}
        >
          <SlotText text={`${arrow} ${deltaAbs} · ${deltaPctAbs}%`} />
        </div>
        <div className="text-neutral-7 text-copy-13 mt-1 truncate">
          {displayName}
        </div>
      </div>
      {stats ? <div className="flex-shrink-0 sm:pt-1">{stats}</div> : null}
    </header>
  )
}

export type StatsItem = { label: string; value: ReactNode; span?: 2 }

export function StockStatGrid({
  items,
  children,
}: {
  items: StatsItem[]
  children?: ReactNode
}) {
  return (
    <div className="text-neutral-7 font-mono text-label-12 grid grid-cols-2 gap-x-5 gap-y-1 tabular-nums sm:min-w-[220px]">
      {items.map((it, i) => (
        <span
          key={i}
          className={clsx(
            'flex items-baseline justify-between gap-3',
            it.span === 2 && 'col-span-2',
          )}
        >
          <span className="opacity-70">{it.label}</span>
          <span className="text-neutral-9">{it.value}</span>
        </span>
      ))}
      {children ? <div className="col-span-2 mt-1.5">{children}</div> : null}
    </div>
  )
}

export function Range52W({
  low,
  high,
  value,
  formatter,
}: {
  low: number
  high: number
  value: number
  formatter: Intl.NumberFormat
}) {
  const pct = Math.min(100, Math.max(0, ((value - low) / (high - low)) * 100))
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="opacity-70">52W</span>
        <span className="bg-neutral-9/10 relative h-[3px] flex-1 rounded-full">
          <span
            className="bg-neutral-9 absolute -top-[2.5px] size-2 rounded-full transition-[left] duration-200"
            style={{ left: `calc(${pct}% - 4px)` }}
          />
        </span>
      </div>
      <div className="text-neutral-6 text-caption-10 mt-1 flex justify-between">
        <span>{formatter.format(low)}</span>
        <span>{formatter.format(high)}</span>
      </div>
    </div>
  )
}

export function StockFooter({
  left,
  right,
}: {
  left: ReactNode
  right: ReactNode
}) {
  return (
    <footer className="text-neutral-7 font-mono text-label-12 mt-3 flex items-center justify-between gap-4 tabular-nums">
      <span className="truncate">{left}</span>
      <span className="flex-shrink-0">{right}</span>
    </footer>
  )
}

function SkeletonMasthead({ symbol }: { symbol?: string }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
      <div className="min-w-0">
        <div className="text-neutral-7 font-mono text-caption-10 flex items-center gap-x-1.5 tracking-[0.14em] uppercase">
          <SymbolAvatar symbol={symbol ?? '?'} />
          <span>{symbol ?? ' '}</span>
        </div>
        <div className="bg-neutral-3/60 mt-1.5 h-9 w-40 rounded" />
        <div className="bg-neutral-3/60 mt-1.5 h-[12px] w-24 rounded" />
        <div className="bg-neutral-3/60 mt-1 h-[13px] w-32 rounded" />
      </div>
      <div className="hidden flex-shrink-0 space-y-1.5 sm:block sm:w-[220px] sm:pt-1">
        <div className="bg-neutral-3/60 h-[12px] w-full rounded" />
        <div className="bg-neutral-3/60 h-[12px] w-full rounded" />
        <div className="bg-neutral-3/60 h-[12px] w-2/3 rounded" />
      </div>
    </header>
  )
}

function SkeletonBody({
  height,
  message,
}: {
  height: number
  message?: ReactNode
}) {
  return (
    <div
      aria-hidden={message ? undefined : 'true'}
      className="flex w-full items-center justify-center"
      style={{ height }}
    >
      {message ? (
        <span className="text-neutral-7 text-copy-13">{message}</span>
      ) : null}
    </div>
  )
}

function SkeletonFooter() {
  return (
    <footer className="mt-3 flex items-center justify-between">
      <span className="bg-neutral-3/60 inline-block h-[12px] w-24 rounded" />
      <span className="bg-neutral-3/60 inline-block h-[12px] w-20 rounded" />
    </footer>
  )
}

export function StockSnapshotSkeleton({
  symbol,
  message,
}: {
  symbol?: string
  message?: ReactNode
}) {
  return (
    <StockFrame>
      <SkeletonMasthead symbol={symbol} />
      <SkeletonBody height={SNAPSHOT_BODY_HEIGHT} message={message} />
      <SkeletonFooter />
    </StockFrame>
  )
}

export function StockKLineSkeleton({
  symbol,
  message,
}: {
  symbol?: string
  message?: ReactNode
}) {
  return (
    <StockFrame>
      <SkeletonMasthead symbol={symbol} />
      <SkeletonBody height={KLINE_BODY_HEIGHT} message={message} />
      <SkeletonFooter />
    </StockFrame>
  )
}

const RETRY_BUTTON_CLASS =
  'border-neutral-3 hover:border-neutral-5 text-neutral-7 hover:text-neutral-9 focus-visible:ring-(--a) focus-visible:ring-2 focus-visible:outline-none rounded-sm border px-2 py-0.5 text-label-12 transition-colors'

export function RetryMessage({
  label,
  onRetry,
}: {
  label: string
  onRetry: () => void
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span>{label}</span>
      <button className={RETRY_BUTTON_CLASS} type="button" onClick={onRetry}>
        Retry
      </button>
    </span>
  )
}
