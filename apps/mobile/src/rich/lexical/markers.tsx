import type { ReactNode } from 'react'

import type { InlineRun, RichTextBlock } from '../inline-runs'

export interface RunMarkerProps {
  run: InlineRun
}

export interface InlineMarkerProps {
  children?: ReactNode
  patch: Partial<InlineRun>
}

export interface TextBlockMarkerProps {
  block: Omit<RichTextBlock, 'id'>
  blockId?: string
}

export interface ListItemData {
  checked?: boolean
  nested: ListData[]
  runs: InlineRun[]
}

export interface ListData {
  items: ListItemData[]
  listType: 'bullet' | 'check' | 'number'
  start: number
}

export interface ListMarkerProps {
  blockId?: string
  list: ListData
}

export interface ListItemMarkerProps {
  item: ListItemData
}

export interface TableCellData {
  header: boolean
  runs: InlineRun[]
}

export interface TableRowMarkerProps {
  cells: TableCellData[]
}

export interface TableCellMarkerProps {
  cell: TableCellData
}

export interface ViewBlockMarkerProps {
  blockId?: string
  children?: ReactNode
  node: Record<string, unknown> & { type: string }
}

export const RunMarker = (_props: RunMarkerProps): null => null
export const InlineMarker = (_props: InlineMarkerProps): null => null
export const LineBreakMarker = (): null => null
export const TextBlockMarker = (_props: TextBlockMarkerProps): null => null
export const ListMarker = (_props: ListMarkerProps): null => null
export const ListItemMarker = (_props: ListItemMarkerProps): null => null
export const TableRowMarker = (_props: TableRowMarkerProps): null => null
export const TableCellMarker = (_props: TableCellMarkerProps): null => null
export const ViewBlockMarker = (_props: ViewBlockMarkerProps): null => null
