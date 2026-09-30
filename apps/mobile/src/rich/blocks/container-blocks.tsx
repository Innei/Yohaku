import { radius } from '@yohaku/design-system/tokens'
import { SymbolView } from 'expo-symbols'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { AppText, NativePressable } from '@/components/ui'
import { usePalette } from '@/theme/palette'
import { useNativeSerifFontStyle } from '@/theme/serif-font'

import { useRichDocument } from '../lexical/context'
import { groupSegments } from '../lexical/group'
import { calloutKind } from './callout'
import { type BlockProps, str } from './types'

export function CalloutBlock({ node }: BlockProps) {
  const palette = usePalette()
  const serif = useNativeSerifFontStyle()
  const doc = useRichDocument()
  const kind = calloutKind(str(node.alertType) || str(node.bannerType))
  const tone = kind.tone === 'accent' ? palette.accent : palette.semantic[kind.tone]
  const content = node.content as { root?: unknown } | undefined
  return (
    <View
      style={[
        styles.callout,
        { backgroundColor: palette.neutral[1], borderColor: palette.neutral[3] },
      ]}
    >
      <View style={styles.head}>
        <View style={[styles.seal, { borderColor: tone }]}>
          <AppText color={tone} style={[styles.glyph, serif]}>
            {kind.glyph}
          </AppText>
        </View>
        <AppText color={tone} style={styles.label}>
          {kind.label}
        </AppText>
      </View>
      {content?.root ? doc.renderNested(content as never) : null}
    </View>
  )
}

export function DetailsBlock({ children, node }: BlockProps) {
  const palette = usePalette()
  const doc = useRichDocument()
  const [open, setOpen] = useState(Boolean(node.open))
  return (
    <View style={[styles.details, { borderColor: palette.neutral[3] }]}>
      <NativePressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        haptic={false}
        onPress={() => setOpen((value) => !value)}
      >
        <View style={styles.summary}>
          <SymbolView
            name={open ? 'chevron.down' : 'chevron.right'}
            size={12}
            tintColor={palette.neutral[5]}
            weight="semibold"
          />
          <AppText style={styles.summaryText}>
            {str(node.summary) || '详情'}
          </AppText>
        </View>
      </NativePressable>
      {open ? (
        <View style={styles.detailsBody}>
          {doc.renderSegments(
            groupSegments(children, `d${node.summary ?? ''}`),
          )}
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  callout: {
    borderCurve: 'continuous',
    borderRadius: radius.field,
    borderWidth: 1,
    gap: 8,
    marginVertical: 12,
    paddingBottom: 14,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  head: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  seal: {
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 1.2,
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  glyph: { fontSize: 11, lineHeight: 14 },
  label: { fontSize: 12, fontWeight: '600', lineHeight: 16 },
  details: {
    borderBottomWidth: 1,
    borderTopWidth: 1,
    marginVertical: 12,
  },
  summary: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    minHeight: 48,
  },
  summaryText: { flex: 1, fontSize: 15, fontWeight: '500', lineHeight: 22 },
  detailsBody: { paddingBottom: 16, paddingLeft: 22 },
})
