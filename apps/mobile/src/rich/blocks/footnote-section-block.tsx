import { StyleSheet, View } from 'react-native'

import { AppText } from '@/components/ui'
import { usePalette } from '@/theme/palette'
import { useNativeSerifFontStyle } from '@/theme/serif-font'

import { useRichDocument } from '../lexical/context'
import { footnoteEntries } from '../lexical/footnotes'
import type { BlockProps } from './types'

export function FootnoteSectionBlock({ node }: BlockProps) {
  const palette = usePalette()
  const serif = useNativeSerifFontStyle()
  const doc = useRichDocument()
  const definitions =
    node.definitions && typeof node.definitions === 'object'
      ? (node.definitions as Record<string, string>)
      : {}
  const entries = footnoteEntries(definitions, doc.footnotes ?? new Map())
  if (entries.length === 0) return null

  return (
    <View style={styles.wrap}>
      <View style={[styles.rule, { backgroundColor: palette.neutral[3] }]} />
      {entries.map((entry) => (
        <View key={entry.id} style={styles.row}>
          <AppText
            color={palette.neutral[6]}
            style={[styles.label, serif]}
            variant="secondary"
          >
            {entry.label}
          </AppText>
          <AppText
            selectable
            color={palette.neutral[7]}
            style={styles.text}
            variant="secondary"
          >
            {entry.text}
          </AppText>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
    marginTop: 24,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 14,
  },
  label: {
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'right',
    width: 16,
  },
  text: {
    flex: 1,
    fontSize: 13,
    lineHeight: 21,
  },
})
