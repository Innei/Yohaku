import { useState } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'

import { usePalette } from '@/theme/palette'

import type { GroupedListNativeRow } from '../../../modules/yohaku'
import { GroupedListView } from '../../../modules/yohaku'

export interface GroupedListRow {
  chevron?: boolean
  danger?: boolean
  id: string
  label: string
  onPress?: () => void
  value?: string
}

const ROW_HEIGHT_ESTIMATE = 46

export function GroupedList({
  rows,
  style,
}: {
  rows: GroupedListRow[]
  style?: StyleProp<ViewStyle>
}) {
  const palette = usePalette()
  const [height, setHeight] = useState<number | null>(null)

  const nativeRows: GroupedListNativeRow[] = rows.map((row) => ({
    id: row.id,
    label: row.label,
    value: row.value,
    chevron: row.chevron ?? false,
    danger: row.danger ?? false,
    pressable: row.onPress !== undefined,
  }))

  return (
    <GroupedListView
      dangerColor={palette.semantic.error}
      rows={nativeRows}
      style={[{ height: height ?? rows.length * ROW_HEIGHT_ESTIMATE }, style]}
      onNativeHeight={(event) => setHeight(event.nativeEvent.height)}
      onRowPress={(event) => {
        rows.find((row) => row.id === event.nativeEvent.id)?.onPress?.()
      }}
    />
  )
}
