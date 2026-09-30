import { YohakuMath } from '@modules/yohaku'
import { SymbolView } from 'expo-symbols'
import { useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'

import { AppText } from '@/components/ui'
import { usePalette } from '@/theme/palette'

import { CodeCard } from './code-block'
import { type BlockProps, str } from './types'

const FONT_SIZE = 21

export function MathBlock({ node }: BlockProps) {
  const palette = usePalette()
  const latex = str(node.equation)
  const [size, setSize] = useState<{ height: number; width: number } | null>(
    null,
  )
  const [failed, setFailed] = useState(false)

  if (failed || !latex.trim()) {
    return (
      <CodeCard
        code={latex}
        header={
          <View style={styles.failed}>
            <SymbolView
              name="exclamationmark.triangle"
              size={12}
              tintColor={palette.semantic.warning}
            />
            <AppText color={palette.semantic.warning} variant="meta">
              公式未能排版
            </AppText>
          </View>
        }
      />
    )
  }

  return (
    <ScrollView
      horizontal
      contentContainerStyle={styles.content}
      showsHorizontalScrollIndicator={false}
      style={styles.wrap}
    >
      <YohakuMath
        color={palette.neutral[9]}
        fontSize={FONT_SIZE}
        latex={latex}
        style={{
          height: size?.height ?? FONT_SIZE * 2,
          width: size?.width ?? 1,
        }}
        onContentSize={(event) => setSize(event.nativeEvent)}
        onMathError={() => setFailed(true)}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  failed: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  wrap: {
    marginVertical: 12,
  },
  content: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
  },
})
