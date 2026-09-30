import { SymbolView } from 'expo-symbols'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { AppText, NativePressable } from '@/components/ui'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'

import { CodeCard } from './code-block'
import { snippetFiles } from './code-snippet'
import type { BlockProps } from './types'

// ponytail: highlightLines is ignored; tint lines in YohakuCodeView once a post uses it.
export function CodeSnippetBlock({ node }: BlockProps) {
  const palette = usePalette()
  const files = snippetFiles(node)
  const [active, setActive] = useState(0)
  const file = files[Math.min(active, files.length - 1)]
  if (!file) return null

  if (files.length === 1) {
    return (
      <CodeCard
        code={file.code}
        language={file.language}
        header={
          <View style={styles.title}>
            <SymbolView
              name="doc.text"
              size={14}
              tintColor={palette.neutral[6]}
            />
            <AppText numberOfLines={1} style={styles.name}>
              {file.filename}
            </AppText>
          </View>
        }
      />
    )
  }

  return (
    <CodeCard
      divided
      code={file.code}
      language={file.language}
      header={
        <View accessibilityRole="tablist" style={styles.tabs}>
          {files.map((entry, index) => {
            const selected = entry === file
            return (
              <NativePressable
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                haptic={false}
                hitSlop={{ bottom: 10, top: 10 }}
                key={`${index}:${entry.filename}`}
                onPress={() => setActive(index)}
              >
                <AppText
                  color={selected ? palette.neutral[9] : palette.neutral[6]}
                  style={[
                    styles.tab,
                    fonts.mono,
                    selected && { borderBottomColor: palette.neutral[9] },
                  ]}
                >
                  {entry.filename}
                </AppText>
              </NativePressable>
            )
          })}
        </View>
      }
    />
  )
}

const styles = StyleSheet.create({
  title: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
    gap: 8,
  },
  name: { flexShrink: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  tab: {
    borderBottomColor: 'transparent',
    borderBottomWidth: 2,
    fontSize: 12,
    lineHeight: 18,
    paddingBottom: 6,
    paddingTop: 6,
  },
})
