'use client'
import { sx, sxClass } from '../../../lib/sx'
import { atoms } from '../../../styles/atoms.stylex'
import { extras } from '../../../styles/extras.stylex'
import { yohaku } from '../../../styles/yohaku.stylex'
import * as stylex from '@stylexjs/stylex'

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
      {...sx(extras.fontSystemUi, atoms.text_neutral_9, atoms.relative, atoms.my_8, atoms.w_full, atoms.border_y, atoms.py_4, atoms.tabular_nums, className)}
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
        {...sx(atoms.bg_neutral_2, atoms.my_0, atoms.flex_shrink_0, atoms.rounded_full, atoms.object_contain, atoms.p_px)}
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
      {...sx(atoms.bg_neutral_9, atoms.text_neutral_1, atoms.inline_flex, atoms.flex_shrink_0, atoms.items_center, atoms.justify_center, atoms.rounded_full, atoms.font_semibold)}
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

const marketDot = stylex.create({
  live: {
    backgroundColor: {
      default: '#1F9D55',
      ':where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *)':
        '#34D399',
    },
  },
  ext: {
    backgroundColor: {
      default: '#D97706',
      ':where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *)':
        '#FBBF24',
    },
  },
  closed: {
    backgroundColor: yohaku.neutral6,
  },
})

export function MarketStateDot({ state }: { state: MarketState }) {
  const isLive = state === 'regular'
  const isExt = state === 'pre' || state === 'post'
  const tone = isLive
    ? marketDot.live
    : isExt
      ? marketDot.ext
      : marketDot.closed
  return (
    <span {...sx(atoms.inline_flex, atoms.items_center)}>
      <span
        aria-hidden="true"
        {...sx(
          atoms.mr_1,
          atoms.inline_block,
          atoms.h_1dot5,
          atoms.w_1dot5,
          atoms.rounded_full,
          atoms.align_middle,
          tone,
        )}
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
    <header {...sx(atoms.flex, atoms.flex_col, atoms.gap_4, atoms.sm_flex_row, atoms.sm_items_start, atoms.sm_justify_between, atoms.sm_gap_8)}>
      <div {...sx(atoms.min_w_0)}>
        <div {...sx(atoms.text_neutral_7, atoms.font_mono, atoms.text_caption_10, atoms.flex, atoms.flex_wrap, atoms.items_center, atoms.gap_x_1dot5, atoms.tracking__0dot14em, atoms.uppercase)}>
          <SymbolAvatar avatarUrl={avatarUrl} symbol={meta.symbol} />
          {metaParts.map((part, i) => (
            <span {...sx(atoms.inline_flex, atoms.items_center)} key={i}>
              {i > 0 ? (
                <span aria-hidden="true" {...sx(atoms.text_neutral_6, atoms.mr_1dot5)}>
                  ·
                </span>
              ) : null}
              {part}
            </span>
          ))}
        </div>
        <div {...sx(atoms.text_neutral_10, atoms.font_mono, atoms.text_display_36, atoms.mt_1dot5, atoms.leading_none, atoms.tracking___0dot015em)}>
          <SlotText text={displayPrice} />
        </div>
        <div
          {...sx(atoms.text_label_12, atoms.mt_1dot5, atoms.font_medium)}
          style={{ color: isUp ? upText : downText }}
        >
          <SlotText text={`${arrow} ${deltaAbs} · ${deltaPctAbs}%`} />
        </div>
        <div {...sx(atoms.text_neutral_7, atoms.text_copy_13, atoms.mt_1, atoms.truncate)}>
          {displayName}
        </div>
      </div>
      {stats ? <div {...sx(atoms.flex_shrink_0, atoms.sm_pt_1)}>{stats}</div> : null}
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
    <div {...sx(atoms.text_neutral_7, atoms.font_mono, atoms.text_label_12, atoms.grid, atoms.grid_cols_2, atoms.gap_x_5, atoms.gap_y_1, atoms.tabular_nums, atoms.sm_min_w__220px)}>
      {items.map((it, i) => (
        <span
          key={i}
          {...sx(
            atoms.flex, atoms.items_baseline, atoms.justify_between, atoms.gap_3,
            it.span === 2 && atoms.col_span_2,
          )}
        >
          <span {...sx(atoms.opacity_70)}>{it.label}</span>
          <span {...sx(atoms.text_neutral_9)}>{it.value}</span>
        </span>
      ))}
      {children ? <div {...sx(atoms.col_span_2, atoms.mt_1dot5)}>{children}</div> : null}
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
      <div {...sx(atoms.flex, atoms.items_center, atoms.gap_2)}>
        <span {...sx(atoms.opacity_70)}>52W</span>
        <span {...sx(atoms.bg_neutral_9_10, atoms.relative, atoms.h__3px, atoms.flex_1, atoms.rounded_full)}>
          <span
            {...sx(atoms.bg_neutral_9, atoms.absolute, atoms._top__2dot5px, atoms.size_2, atoms.rounded_full, atoms.transition__left, atoms.duration_200)}
            style={{ left: `calc(${pct}% - 4px)` }}
          />
        </span>
      </div>
      <div {...sx(atoms.text_neutral_6, atoms.text_caption_10, atoms.mt_1, atoms.flex, atoms.justify_between)}>
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
    <footer {...sx(atoms.text_neutral_7, atoms.font_mono, atoms.text_label_12, atoms.mt_3, atoms.flex, atoms.items_center, atoms.justify_between, atoms.gap_4, atoms.tabular_nums)}>
      <span {...sx(atoms.truncate)}>{left}</span>
      <span {...sx(atoms.flex_shrink_0)}>{right}</span>
    </footer>
  )
}

function SkeletonMasthead({ symbol }: { symbol?: string }) {
  return (
    <header {...sx(atoms.flex, atoms.flex_col, atoms.gap_4, atoms.sm_flex_row, atoms.sm_items_start, atoms.sm_justify_between, atoms.sm_gap_8)}>
      <div {...sx(atoms.min_w_0)}>
        <div {...sx(atoms.text_neutral_7, atoms.font_mono, atoms.text_caption_10, atoms.flex, atoms.items_center, atoms.gap_x_1dot5, atoms.tracking__0dot14em, atoms.uppercase)}>
          <SymbolAvatar symbol={symbol ?? '?'} />
          <span>{symbol ?? ' '}</span>
        </div>
        <div {...sx(atoms.bg_neutral_3_60, atoms.mt_1dot5, atoms.h_9, atoms.w_40, atoms.rounded)} />
        <div {...sx(atoms.bg_neutral_3_60, atoms.mt_1dot5, atoms.h__12px, atoms.w_24, atoms.rounded)} />
        <div {...sx(atoms.bg_neutral_3_60, atoms.mt_1, atoms.h__13px, atoms.w_32, atoms.rounded)} />
      </div>
      <div {...sx(atoms.hidden, atoms.flex_shrink_0, atoms.space_y_1dot5, atoms.sm_block, atoms.sm_w__220px, atoms.sm_pt_1)}>
        <div {...sx(atoms.bg_neutral_3_60, atoms.h__12px, atoms.w_full, atoms.rounded)} />
        <div {...sx(atoms.bg_neutral_3_60, atoms.h__12px, atoms.w_full, atoms.rounded)} />
        <div {...sx(atoms.bg_neutral_3_60, atoms.h__12px, atoms.w_2_3, atoms.rounded)} />
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
      {...sx(atoms.flex, atoms.w_full, atoms.items_center, atoms.justify_center)}
      style={{ height }}
    >
      {message ? (
        <span {...sx(atoms.text_neutral_7, atoms.text_copy_13)}>{message}</span>
      ) : null}
    </div>
  )
}

function SkeletonFooter() {
  return (
    <footer {...sx(atoms.mt_3, atoms.flex, atoms.items_center, atoms.justify_between)}>
      <span {...sx(atoms.bg_neutral_3_60, atoms.inline_block, atoms.h__12px, atoms.w_24, atoms.rounded)} />
      <span {...sx(atoms.bg_neutral_3_60, atoms.inline_block, atoms.h__12px, atoms.w_20, atoms.rounded)} />
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
    <span {...sx(atoms.inline_flex, atoms.items_center, atoms.gap_2)}>
      <span>{label}</span>
      <button className={RETRY_BUTTON_CLASS} type="button" onClick={onRetry}>
        Retry
      </button>
    </span>
  )
}
