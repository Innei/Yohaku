import { SymbolView } from 'expo-symbols'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { AppText, NativePressable } from '@/components/ui'
import { usePalette } from '@/theme/palette'

import { useRichDocument } from '../lexical/context'
import { groupSegments } from '../lexical/group'
import { type BlockProps, str } from './types'

const CALLOUT_LABEL: Record<string, string> = {
  note: '注',
  tip: '提示',
  important: '重要',
  warning: '注意',
  caution: '警告',
  info: '信息',
  success: '完成',
  error: '错误',
}

export function CalloutBlock({ node }: BlockProps) {
  const palette = usePalette()
  const doc = useRichDocument()
  const kind = str(node.alertType) || str(node.bannerType) || 'note'
  const content = node.content as { root?: unknown } | undefined
  return (
    <View
      style={[
        styles.callout,
        {
          borderLeftColor: palette.accent,
          backgroundColor: palette.neutral[1],
        },
      ]}
    >
      <AppText color={palette.accent} variant="eyebrow">
        {CALLOUT_LABEL[kind] ?? kind.toUpperCase()}
      </AppText>
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
        haptic={false}
        onPress={() => setOpen((value) => !value)}
      >
        <View style={styles.summary}>
          <SymbolView
            name={open ? 'chevron.down' : 'chevron.right'}
            size={13}
            tintColor={palette.neutral[6]}
          />
          <AppText variant="body">{str(node.summary) || '详情'}</AppText>
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
    marginVertical: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderLeftWidth: 3,
    borderRadius: 4,
    gap: 6,
  },
  details: {
    marginVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    overflow: 'hidden',
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  detailsBody: { paddingHorizontal: 12, paddingBottom: 12 },
})
