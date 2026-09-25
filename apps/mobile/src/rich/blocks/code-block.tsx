import * as Clipboard from 'expo-clipboard'
import { type ReactNode, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'

import { AppText, NativePressable } from '@/components/ui'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'

import { type BlockProps, str } from './types'

export function CodeCard({
  code,
  header,
}: {
  code: string
  header: ReactNode
}) {
  const palette = usePalette()
  const [copied, setCopied] = useState(false)

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: palette.neutral[1],
          borderColor: palette.neutral[3],
        },
      ]}
    >
      <View style={[styles.header, { borderBottomColor: palette.neutral[3] }]}>
        <View style={styles.headerLead}>{header}</View>
        <NativePressable
          onPress={() => {
            void Clipboard.setStringAsync(code)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          }}
        >
          <AppText color={palette.neutral[6]} variant="meta">
            {copied ? '已复制' : '复制'}
          </AppText>
        </NativePressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Text
          selectable
          style={[styles.code, fonts.mono, { color: palette.neutral[9] }]}
        >
          {code}
        </Text>
      </ScrollView>
    </View>
  )
}

export function CodeBlock({ node }: BlockProps) {
  const palette = usePalette()
  const language = str(node.language)
  return (
    <CodeCard
      code={str(node.code)}
      header={
        <AppText color={palette.neutral[6]} variant="meta">
          {language || 'code'}
        </AppText>
      }
    />
  )
}

// ponytail: plain monospace text; shiki token colouring comes with the code
// highlighter shim once native bundling of the grammar set is sorted out.
const styles = StyleSheet.create({
  wrap: {
    marginVertical: 12,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLead: { flex: 1, flexDirection: 'row' },
  code: { fontSize: 13, lineHeight: 20, padding: 12 },
})
