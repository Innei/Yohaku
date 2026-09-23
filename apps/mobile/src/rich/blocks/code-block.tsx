import * as Clipboard from 'expo-clipboard'
import { useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'

import { AppText, NativePressable } from '@/components/ui'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'

import { type BlockProps, str } from './types'

export function CodeBlock({ node }: BlockProps) {
  const palette = usePalette()
  const [copied, setCopied] = useState(false)
  const code = str(node.code)
  const language = str(node.language)

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
        <AppText color={palette.neutral[6]} variant="meta">
          {language || 'code'}
        </AppText>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  code: { fontSize: 13, lineHeight: 20, padding: 12 },
})
