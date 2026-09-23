import { useState } from 'react'
import {
  Platform,
  type StyleProp,
  StyleSheet,
  View,
  type ViewProps,
  type ViewStyle,
} from 'react-native'

import { usePalette } from '@/theme/palette'

import type {
  GroupedListNativeRow,
  NavigationHeaderMenuItem,
} from '../../../modules/yohaku'
import { GroupedListView, TicketStubView } from '../../../modules/yohaku'
import { AppText } from './app-text'

export const groupedListRadius =
  Number.parseInt(String(Platform.Version), 10) >= 26 ? 26 : 10

export function GroupedCard({ style, children, ...rest }: ViewProps) {
  return (
    <View style={style} {...rest}>
      <TicketStubView
        cornerRadius={groupedListRadius}
        divisions={1}
        notchRadius={0}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  )
}

export interface GroupedListRow {
  chevron?: boolean
  danger?: boolean
  id: string
  label: string
  menu?: NavigationHeaderMenuItem[]
  navigates?: boolean
  onMenuSelect?: (itemId: string) => void
  onPress?: () => void
  value?: string
}

const ROW_HEIGHT_ESTIMATE = 46

let lastTextLeading = 36

export function GroupedList({
  header,
  rows,
  style,
}: {
  header?: string
  rows: GroupedListRow[]
  style?: StyleProp<ViewStyle>
}) {
  const palette = usePalette()
  const [height, setHeight] = useState<number | null>(null)
  const [textLeading, setTextLeading] = useState(lastTextLeading)

  const nativeRows: GroupedListNativeRow[] = rows.map((row) => ({
    id: row.id,
    label: row.label,
    value: row.value,
    chevron: row.chevron ?? false,
    danger: row.danger ?? false,
    navigates: row.navigates ?? false,
    pressable: row.onPress !== undefined,
    menu: row.menu,
  }))

  return (
    <View style={[styles.section, style]}>
      {header ? (
        <AppText
          color={palette.neutral[6]}
          style={[styles.header, { marginLeft: textLeading }]}
          variant="eyebrow"
        >
          {header}
        </AppText>
      ) : null}
      <GroupedListView
        dangerColor={palette.semantic.error}
        rows={nativeRows}
        style={{ height: height ?? rows.length * ROW_HEIGHT_ESTIMATE }}
        onNativeMetrics={({ nativeEvent }) => {
          setHeight(nativeEvent.height)
          lastTextLeading = nativeEvent.textLeading
          setTextLeading(nativeEvent.textLeading)
        }}
        onRowMenuAction={({ nativeEvent }) => {
          rows
            .find((row) => row.id === nativeEvent.id)
            ?.onMenuSelect?.(nativeEvent.item)
        }}
        onRowPress={(event) => {
          rows.find((row) => row.id === event.nativeEvent.id)?.onPress?.()
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    gap: 8,
  },
  header: {
    textTransform: 'uppercase',
  },
})
