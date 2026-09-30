import { StyleSheet, View } from 'react-native'

import { AppText } from '@/components/ui'
import { usePalette } from '@/theme/palette'
import { fonts } from '@/theme/fonts'

import { useRichDocument } from '../lexical/context'
import { footnoteEntries } from '../lexical/footnotes'
import type { BlockProps } from './types'

export function FootnoteSectionBlock({ node }: BlockProps) {
  const palette = usePalette()
  const doc = useRichDocument()
  const definitions =
    node.definitions && typeof node.definitions === 'object'
      ? (node.definitions as Record<string, string>)
      : {}
  const entries = footnoteEntries(definitions, doc.footnotes ?? new Map())
  if (entries.length === 0) return null

  return (
    <View style={styles.wrap}>
      <View style={[styles.rule, { backgroundColor: palette.neutral[4] }]} />
      {entries.map((entry) => (
        <View key={entry.id} style={styles.row}>
          <AppText
            color={palette.accent}
            style={[styles.label, fonts.mono]}
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
    height: 1,
    marginBottom: 6,
    width: 32,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 11,
    lineHeight: 21,
    textAlign: 'right',
    width: 14,
  },
  text: {
    flex: 1,
    fontSize: 13,
    lineHeight: 21,
  },
})
