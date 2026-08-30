export const INDEX_EMPTY_ID = '__empty'
export const INDEX_STATUS_ID = '__status'

export const indexListEstimatedHeight = {
  empty: 64,
  row: 88,
  status: 28,
} as const

export type FlattenedIndexListItem = {
  estimatedHeight: number
  id: string
  type: 'empty' | 'row' | 'status'
}

export function flattenIndexList({
  rowIds,
  showEmpty,
  showStatus,
}: {
  rowIds: string[]
  showEmpty: boolean
  showStatus: boolean
}): FlattenedIndexListItem[] {
  const items: FlattenedIndexListItem[] = []
  if (showStatus) {
    items.push({
      id: INDEX_STATUS_ID,
      type: 'status',
      estimatedHeight: indexListEstimatedHeight.status,
    })
  }
  if (showEmpty) {
    items.push({
      id: INDEX_EMPTY_ID,
      type: 'empty',
      estimatedHeight: indexListEstimatedHeight.empty,
    })
    return items
  }
  for (const id of rowIds) {
    items.push({
      id,
      type: 'row',
      estimatedHeight: indexListEstimatedHeight.row,
    })
  }
  return items
}
