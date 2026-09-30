import { YohakuCode } from '@modules/yohaku'
import { radius } from '@yohaku/design-system/tokens'
import * as Clipboard from 'expo-clipboard'
import { SymbolView } from 'expo-symbols'
import { type ReactNode, useState } from 'react'
import { StyleSheet, useWindowDimensions, View } from 'react-native'

import { AppText, NativePressable } from '@/components/ui'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'

import { codeMetrics } from '../body-scale'
import { type BlockProps, str } from './types'

const INSET = 16
const TOP = 14
const HEADER_TOP = 10
const LABEL_ROOM = 12

export function CopyCodeButton({ code }: { code: string }) {
  const palette = usePalette()
  const [copied, setCopied] = useState(false)
  return (
    <NativePressable
      accessibilityLabel={copied ? '已复制' : '复制代码'}
      accessibilityRole="button"
      hitSlop={8}
      style={styles.copy}
      onPress={() => {
        void Clipboard.setStringAsync(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
    >
      <SymbolView
        name={copied ? 'checkmark' : 'doc.on.doc'}
        size={14}
        tintColor={palette.neutral[copied ? 8 : 6]}
      />
    </NativePressable>
  )
}

export function CodeCard({
  bare,
  code,
  divided,
  header,
  language,
}: {
  bare?: boolean
  code: string
  divided?: boolean
  header?: ReactNode
  language?: string
}) {
  const palette = usePalette()
  const { fontScale } = useWindowDimensions()
  const { fontSize, lineHeight } = codeMetrics(fontScale)
  const top = header ? (divided ? 12 : HEADER_TOP) : bare ? 12 : TOP
  const [height, setHeight] = useState<number | null>(null)
  const label = !bare && !header && language ? language : null

  return (
    <View
      style={
        bare
          ? null
          : [
              styles.plate,
              {
                backgroundColor: palette.neutral[1],
                borderColor: palette.neutral[3],
              },
              label ? { paddingBottom: LABEL_ROOM } : null,
            ]
      }
    >
      {header ? (
        <View
          style={[
            styles.header,
            divided && [styles.divided, { borderBottomColor: palette.neutral[3] }],
          ]}
        >
          <View style={styles.headerLead}>{header}</View>
          <CopyCodeButton code={code} />
        </View>
      ) : null}
      <YohakuCode
        boldFontFamily={fonts.monoSemiBold.fontFamily}
        code={code}
        color={palette.neutral[8]}
        fontFamily={fonts.mono.fontFamily}
        fontSize={fontSize}
        language={language}
        lineHeight={lineHeight}
        padding={bare ? 14 : INSET}
        paddingTop={top}
        style={{
          height: height ?? code.split('\n').length * lineHeight + top + INSET,
        }}
        onContentSize={(event) => setHeight(event.nativeEvent.height)}
      />
      {!bare && !header ? (
        <View style={styles.floatingCopy}>
          <CopyCodeButton code={code} />
        </View>
      ) : null}
      {label ? (
        <AppText
          color={palette.neutral[5]}
          numberOfLines={1}
          style={[styles.language, fonts.mono]}
        >
          {label}
        </AppText>
      ) : null}
    </View>
  )
}

export function CodeBlock({ node }: BlockProps) {
  return <CodeCard code={str(node.code)} language={str(node.language)} />
}

const styles = StyleSheet.create({
  plate: {
    marginVertical: 12,
    borderRadius: radius.field,
    borderCurve: 'continuous',
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    minHeight: 34,
    paddingLeft: 14,
    paddingRight: 6,
    paddingTop: 6,
  },
  divided: {
    alignItems: 'flex-end',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingTop: 4,
  },
  headerLead: { flex: 1, flexDirection: 'row' },
  copy: {
    alignItems: 'center',
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  floatingCopy: { position: 'absolute', right: 6, top: 6 },
  language: {
    bottom: 7,
    fontSize: 10,
    lineHeight: 14,
    position: 'absolute',
    right: 14,
  },
})
