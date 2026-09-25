import { YohakuKline } from '@modules/yohaku'
import { useQuery } from '@tanstack/react-query'
import { StyleSheet, View } from 'react-native'

import { api } from '@/api/client'
import { AppText, Paper } from '@/components/ui'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'

import { UnsupportedBlock } from './card-blocks'
import { useBoneColor } from './skeleton'
import { emaSeries, rangeLabel, stockHeader, type StockRange } from './stock'
import { type BlockProps, num, str } from './types'

const CHART_HEIGHT = 226
const FOOTER = '数据来自 Polygon.io · 区间结束后固定'

export function rangeOf(node: BlockProps['node']): StockRange | null {
  const raw = node.range
  if (!raw || typeof raw !== 'object') return null
  const value = raw as Record<string, unknown>
  const range = {
    from: str(value.from),
    interval: str(value.interval),
    to: str(value.to),
  }
  return range.from && range.to && range.interval ? range : null
}

export function emaPeriods(node: BlockProps['node']): number[] {
  if (node.ema === false) return []
  if (!Array.isArray(node.ema)) return [5, 20]
  return node.ema.flatMap((value) => num(value) ?? [])
}

function StockSkeleton() {
  const bone = { backgroundColor: useBoneColor() }
  return (
    <Paper style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleCol}>
          <View style={[styles.bone, { width: 56, height: 20 }, bone]} />
          <View style={[styles.bone, { width: 120, height: 16 }, bone]} />
        </View>
        <View style={[styles.bone, { width: 72, height: 42 }, bone]} />
      </View>
      <View style={[styles.bone, { width: '60%', height: 16 }, bone]} />
      <View style={[styles.chart, styles.bone, bone]} />
      <View style={[styles.bone, { width: '50%', height: 16 }, bone]} />
    </Paper>
  )
}

export function StockBlock({ blockId, node }: BlockProps) {
  const symbol = str(node.symbol)
  const range = rangeOf(node)
  if (node.variant !== 'kline' || !symbol || !range) {
    return <UnsupportedBlock blockId={blockId} node={node} />
  }
  return (
    <StockKline blockId={blockId} node={node} range={range} symbol={symbol} />
  )
}

function StockKline({
  blockId,
  node,
  range,
  symbol,
}: BlockProps & { range: StockRange; symbol: string }) {
  const palette = usePalette()
  const query = useQuery({
    queryFn: () => api.stockBars({ symbol, ...range }),
    queryKey: ['stock-bars', symbol, range.interval, range.from, range.to],
    staleTime: Infinity,
  })

  if (query.isPending) return <StockSkeleton />
  const header = query.data
    ? stockHeader(query.data.meta, query.data.bars)
    : null
  if (!query.data || !header) {
    return <UnsupportedBlock blockId={blockId} node={node} />
  }

  const { meta, bars } = query.data
  const closes = bars.map((bar) => bar.close)
  const emaColors = [palette.accent, palette.neutral[5]]
  const ema = emaPeriods(node)
    .slice(0, emaColors.length)
    .map((period, index) => ({
      color: emaColors[index],
      period,
      values: emaSeries(closes, period),
    }))
  const changeColor = header.up
    ? palette.semantic.success
    : palette.semantic.error
  const subtitle = [meta.longName, meta.exchange].filter(Boolean).join(' · ')

  return (
    <Paper style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleCol}>
          <AppText style={[styles.symbol, fonts.monoSemiBold]}>
            {meta.symbol || symbol}
          </AppText>
          {subtitle ? (
            <AppText numberOfLines={1} variant="meta">
              {subtitle}
            </AppText>
          ) : null}
        </View>
        <View style={styles.priceCol}>
          <AppText style={[styles.price, fonts.monoSemiBold]}>
            {header.lastClose.toFixed(2)}
          </AppText>
          <AppText color={changeColor} style={[styles.change, fonts.mono]}>
            {`${header.up ? '+' : ''}${header.changePct.toFixed(2)}%`}
          </AppText>
        </View>
      </View>
      <View style={styles.legend}>
        <AppText style={styles.range} variant="meta">
          {rangeLabel(range)}
        </AppText>
        {ema.map((line) => (
          <View key={line.period} style={styles.legendItem}>
            <View style={[styles.swatch, { backgroundColor: line.color }]} />
            <AppText variant="meta">{`EMA ${line.period}`}</AppText>
          </View>
        ))}
      </View>
      <YohakuKline
        accessible
        accessibilityLabel={`${meta.symbol || symbol} ${range.interval} K 线`}
        downColor={palette.semantic.error}
        ema={ema}
        gridColor={palette.neutral[3]}
        labelColor={palette.neutral[6]}
        style={styles.chart}
        upColor={palette.semantic.success}
        volumeColor={palette.neutral[4]}
        bars={bars.map((bar) => ({
          c: bar.close,
          h: bar.high,
          l: bar.low,
          o: bar.open,
          t: bar.timestamp,
          v: bar.volume ?? 0,
        }))}
      />
      <AppText color={palette.neutral[5]} style={styles.footer} variant="meta">
        {FOOTER}
      </AppText>
    </Paper>
  )
}

const styles = StyleSheet.create({
  card: { marginVertical: 12, padding: 16, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  titleCol: { flex: 1, gap: 2, minWidth: 0 },
  priceCol: { alignItems: 'flex-end', gap: 2 },
  symbol: { fontSize: 15, lineHeight: 20 },
  price: { fontSize: 20, lineHeight: 24, fontVariant: ['tabular-nums'] },
  change: { fontSize: 12, lineHeight: 16, fontVariant: ['tabular-nums'] },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  range: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
    fontVariant: ['tabular-nums'],
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  swatch: { width: 10, height: 2, borderRadius: 1 },
  chart: { width: '100%', height: CHART_HEIGHT },
  footer: { fontSize: 11, lineHeight: 16 },
  bone: { borderRadius: 6 },
})
