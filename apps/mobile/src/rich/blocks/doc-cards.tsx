import { radius } from '@yohaku/design-system/tokens'
import { SymbolView } from 'expo-symbols'
import { StyleSheet, View } from 'react-native'

import { AppText, NativePressable } from '@/components/ui'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'
import { useNativeSerifFontStyle } from '@/theme/serif-font'

export function FileCard({
  ext,
  name,
  onPress,
  preview,
  size,
}: {
  ext: string
  name: string
  onPress?: () => void
  preview: boolean
  size: string
}) {
  const palette = usePalette()
  return (
    <NativePressable
      accessibilityRole="button"
      disabled={!onPress}
      style={[
        styles.card,
        styles.file,
        { backgroundColor: palette.surface.paper, borderColor: palette.neutral[3] },
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.page,
          { backgroundColor: palette.neutral[1], borderColor: palette.neutral[3] },
        ]}
      >
        <AppText
          color={palette.semantic.error}
          numberOfLines={1}
          style={[styles.ext, fonts.monoSemiBold]}
        >
          {ext || 'FILE'}
        </AppText>
      </View>
      <View style={styles.copy}>
        <AppText numberOfLines={1} style={styles.name}>
          {name}
        </AppText>
        {size ? (
          <AppText color={palette.neutral[6]} style={[styles.size, fonts.mono]}>
            {size}
          </AppText>
        ) : null}
      </View>
      <SymbolView
        name={preview ? 'eye' : 'arrow.up.right'}
        size={15}
        tintColor={palette.neutral[5]}
      />
    </NativePressable>
  )
}

export function NestedDocCard({
  onPress,
  title,
}: {
  onPress?: () => void
  title: string
}) {
  const palette = usePalette()
  const serif = useNativeSerifFontStyle()
  const sheet = {
    backgroundColor: palette.surface.paper,
    borderColor: palette.neutral[3],
  }
  return (
    <View style={styles.stack}>
      <View style={[styles.sheet, styles.sheetBack, sheet]} />
      <View style={[styles.sheet, styles.sheetMiddle, sheet]} />
      <NativePressable
        disabled={!onPress}
        style={[styles.card, styles.nested, sheet]}
        onPress={onPress}
      >
        <AppText color={palette.neutral[5]} style={[styles.eyebrow, fonts.mono]}>
          嵌入文档
        </AppText>
        <AppText numberOfLines={2} style={[styles.docTitle, serif]}>
          {title}
        </AppText>
        {onPress ? (
          <View style={styles.open}>
            <AppText color={palette.accent} variant="secondary">
              展开阅读
            </AppText>
            <SymbolView name="chevron.right" size={10} tintColor={palette.accent} />
          </View>
        ) : null}
      </NativePressable>
    </View>
  )
}

export function UnsupportedCard({
  label,
  onPress,
}: {
  label: string
  onPress?: () => void
}) {
  const palette = usePalette()
  return (
    <View style={[styles.unsupported, { borderColor: palette.neutral[4] }]}>
      <SymbolView name="square.dashed" size={14} tintColor={palette.neutral[5]} />
      <AppText color={palette.neutral[6]} numberOfLines={1} style={styles.flex} variant="secondary">
        {`${label} · 暂不支持原生显示`}
      </AppText>
      {onPress ? (
        <NativePressable haptic={false} style={styles.web} onPress={onPress}>
          <AppText color={palette.accent} variant="secondary">
            网页查看
          </AppText>
          <SymbolView name="arrow.up.right" size={10} tintColor={palette.accent} />
        </NativePressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderCurve: 'continuous',
    borderRadius: radius.field,
    borderWidth: StyleSheet.hairlineWidth,
  },
  file: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    marginVertical: 12,
    padding: 14,
  },
  page: {
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 1,
    height: 46,
    justifyContent: 'flex-end',
    paddingBottom: 6,
    width: 38,
  },
  ext: { fontSize: 9, letterSpacing: 0.4, lineHeight: 12 },
  copy: { flex: 1, gap: 2, minWidth: 0 },
  name: { fontSize: 15, fontWeight: '600', lineHeight: 22 },
  size: { fontSize: 11, lineHeight: 16 },
  stack: { marginBottom: 20, marginTop: 12 },
  sheet: {
    borderCurve: 'continuous',
    borderRadius: radius.field,
    borderWidth: StyleSheet.hairlineWidth,
    height: 20,
    position: 'absolute',
  },
  sheetBack: { bottom: -8, left: 12, opacity: 0.6, right: 12 },
  sheetMiddle: { bottom: -4, left: 6, right: 6 },
  nested: { gap: 4, paddingHorizontal: 16, paddingVertical: 14 },
  eyebrow: { fontSize: 10, letterSpacing: 1.2, lineHeight: 14 },
  docTitle: { fontSize: 17, lineHeight: 25 },
  open: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  unsupported: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: radius.field,
    borderStyle: 'dashed',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginVertical: 12,
    minHeight: 48,
    paddingLeft: 14,
    paddingRight: 6,
  },
  flex: { flex: 1 },
  web: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    minHeight: 44,
    paddingHorizontal: 8,
  },
})
