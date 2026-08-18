'use client'

import { useHost } from '../../../host'
import type { StockSlotProps } from './augment'
import { PortableStockKLine } from './kline-renderer'
import { StockSnapshotRenderer } from './snapshot-renderer'

export function StockBlock(props: StockSlotProps) {
  const { slots } = useHost()

  if (props.variant === 'kline') {
    if (!props.range) return null
    if (slots?.StockKLine) {
      return (
        <slots.StockKLine
          ema={props.ema}
          range={props.range}
          symbol={props.symbol}
        />
      )
    }
    return (
      <PortableStockKLine
        ema={props.ema}
        range={props.range}
        symbol={props.symbol}
      />
    )
  }
  return <StockSnapshotRenderer symbol={props.symbol} />
}
