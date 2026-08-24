import { type as typeScale } from '@yohaku/design-system/tokens'
import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'

import { AppText } from '@/components/ui'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'

export function ListEntryTitle({ children }: { children: string }) {
  return (
    <AppText numberOfLines={2} style={styles.title} variant="entryTitleSans">
      {children}
    </AppText>
  )
}

export function ListEntryMeta({ children }: { children: ReactNode }) {
  return <View style={styles.meta}>{children}</View>
}

export function ListEntryDot() {
  const palette = usePalette()
  return (
    <AppText color={palette.neutral[4]} variant="meta">
      ·
    </AppText>
  )
}

export function ListEntry({
  children,
  title,
  titleSlot,
}: {
  children: ReactNode
  title?: string
  titleSlot?: ReactNode
}) {
  return (
    <View style={styles.item}>
      {titleSlot ?? (title ? <ListEntryTitle>{title}</ListEntryTitle> : null)}
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  item: {
    paddingTop: 12,
    paddingBottom: 11,
  },
  title: {
    ...fonts.sansMedium,
    fontSize: typeScale.copy16.size,
    lineHeight: typeScale.copy16.lineHeight,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 6,
    rowGap: 2,
    marginTop: 10,
  },
})
