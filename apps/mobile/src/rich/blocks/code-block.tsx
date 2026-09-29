import { YohakuCode } from '@modules/yohaku'
import { radius } from '@yohaku/design-system/tokens'
import * as Clipboard from 'expo-clipboard'
import { type ReactNode, useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { AppText, NativePressable, SlotText } from '@/components/ui'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'

import { type BlockProps, str } from './types'

const FONT_SIZE = 13
const LINE_HEIGHT = 20
const INSET = 16
const CODE_TOP = 4

export function CodeCard({
  code,
  header,
  language,
}: {
  code: string
  header?: ReactNode
  language?: string
}) {
  const palette = usePalette()
  const [copied, setCopied] = useState(false)
  const [height, setHeight] = useState(
    () => code.split('\n').length * LINE_HEIGHT + CODE_TOP + INSET,
  )

  return (
    <View style={[styles.plate, { backgroundColor: palette.surface.well }]}>
      <View style={styles.header}>
        <View style={styles.headerLead}>{header}</View>
        <NativePressable
          accessibilityLabel={copied ? '已复制' : '复制'}
          accessibilityRole="button"
          hitSlop={{ bottom: 12, left: 16, right: 16, top: 12 }}
          onPress={() => {
            void Clipboard.setStringAsync(code)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          }}
        >
          <SlotText
            value={copied ? '已复制' : '复制'}
            textStyle={{
              ...styles.action,
              color: palette.neutral[copied ? 8 : 6],
            }}
          />
        </NativePressable>
      </View>
      <YohakuCode
        boldFontFamily={fonts.monoSemiBold.fontFamily}
        code={code}
        color={palette.neutral[9]}
        fontFamily={fonts.mono.fontFamily}
        fontSize={FONT_SIZE}
        language={language}
        lineHeight={LINE_HEIGHT}
        padding={INSET}
        paddingTop={CODE_TOP}
        style={{ height }}
        onContentSize={(event) => setHeight(event.nativeEvent.height)}
      />
    </View>
  )
}

export function CodeLanguageLabel({ language }: { language: string }) {
  const palette = usePalette()
  if (!language) return null
  return (
    <AppText
      color={palette.neutral[6]}
      numberOfLines={1}
      style={[styles.language, fonts.mono]}
    >
      {language.toUpperCase()}
    </AppText>
  )
}

export function CodeBlock({ node }: BlockProps) {
  const language = str(node.language)
  return (
    <CodeCard
      code={str(node.code)}
      header={<CodeLanguageLabel language={language} />}
      language={language}
    />
  )
}

const styles = StyleSheet.create({
  plate: {
    marginVertical: 12,
    borderRadius: radius.field,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 34,
    paddingHorizontal: INSET,
    paddingTop: 8,
  },
  headerLead: { flex: 1, flexDirection: 'row' },
  language: { fontSize: 11, lineHeight: 16, letterSpacing: 0.8 },
  action: { fontSize: 12, lineHeight: 18 },
})
