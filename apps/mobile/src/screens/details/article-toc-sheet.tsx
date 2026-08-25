import { useRouter } from 'expo-router'
import { ScrollView, StyleSheet, View } from 'react-native'

import { AppText, SinkPressable } from '@/components/ui'
import { useTranslations } from '@/i18n'
import {
  emitTocJump,
  groupTocSections,
  peekTocSession,
  TOC_SHEET,
} from '@/lib/article-toc'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'

export function ArticleTocSheet() {
  const palette = usePalette()
  const router = useRouter()
  const t = useTranslations('common')
  const headings = peekTocSession()?.headings ?? []
  const sections = groupTocSections(headings)
  const minLevel = headings.reduce(
    (lowest, heading) => Math.min(lowest, heading.level),
    6,
  )

  const select = (blockId: string) => {
    emitTocJump(blockId)
    router.back()
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      style={{ backgroundColor: palette.surface.desk }}
    >
      <View style={styles.head}>
        <AppText color={palette.neutral[6]} variant="eyebrow">
          {t('toc')}
        </AppText>
        <View style={[styles.rule, { backgroundColor: palette.neutral[4] }]} />
      </View>
      <View style={styles.outline}>
        {sections.map((section, index) => {
          const n = String(index + 1).padStart(2, '0')
          return (
            <View key={section.root.blockId} style={styles.section}>
              <SinkPressable
                accessibilityRole="button"
                style={styles.rootRow}
                onPress={() => select(section.root.blockId)}
              >
                <AppText color={palette.accent} style={styles.index}>
                  {n}
                </AppText>
                <AppText
                  numberOfLines={2}
                  style={styles.rootTitle}
                  variant="letterTitle"
                >
                  {section.root.text}
                </AppText>
              </SinkPressable>
              {section.children.map((child) => (
                <SinkPressable
                  accessibilityRole="button"
                  key={child.blockId}
                  style={[
                    styles.childRow,
                    { paddingLeft: 38 + (child.level - minLevel - 1) * 14 },
                  ]}
                  onPress={() => select(child.blockId)}
                >
                  <View
                    style={[
                      styles.tick,
                      { backgroundColor: palette.neutral[5] },
                    ]}
                  />
                  <AppText
                    color={palette.neutral[7]}
                    numberOfLines={2}
                    variant="secondary"
                  >
                    {child.text}
                  </AppText>
                </SinkPressable>
              ))}
            </View>
          )
        })}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: TOC_SHEET.bottom,
    gap: 16,
  },
  head: {
    gap: 12,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
  },
  outline: {
    gap: TOC_SHEET.sectionGap,
  },
  section: {
    gap: 2,
  },
  rootRow: {
    minHeight: TOC_SHEET.rootRow,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingTop: 10,
  },
  index: {
    ...fonts.mono,
    fontSize: 12,
    lineHeight: 20,
    letterSpacing: 0.6,
    width: 26,
    paddingTop: 3,
  },
  rootTitle: {
    flex: 1,
  },
  childRow: {
    minHeight: TOC_SHEET.childRow,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  tick: {
    width: 10,
    height: StyleSheet.hairlineWidth,
  },
})
