import { useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { AppText, NativePressable } from '@/components/ui'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'

import { CodeCard } from './code-block'
import { snippetFiles } from './code-snippet'
import type { BlockProps } from './types'

// ponytail: highlightLines is ignored until code blocks get syntax colouring.
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
        header={
          <AppText color={palette.neutral[6]} variant="meta">
            {file.filename}
          </AppText>
        }
      />
    )
  }

  return (
    <CodeCard
      code={file.code}
      header={
        <View style={styles.tabs}>
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
                  variant="meta"
                  style={[
                    styles.tab,
                    fonts.mono,
                    selected && {
                      borderBottomColor: palette.accent,
                    },
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
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  tab: {
    borderBottomColor: 'transparent',
    borderBottomWidth: 2,
    paddingBottom: 2,
  },
})
