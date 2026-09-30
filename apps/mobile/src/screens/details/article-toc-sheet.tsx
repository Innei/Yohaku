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
  const tocSession = peekTocSession()
  const headings = tocSession?.headings ?? []
  const presence = tocSession?.presence
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
        <View style={styles.headRow}>
          <AppText color={palette.neutral[6]} variant="eyebrow">
            {t('toc')}
          </AppText>
          {presence?.total ? (
            <AppText color={palette.neutral[6]} variant="meta">
              {t('readingNow', { count: presence.total })}
            </AppText>
          ) : null}
        </View>
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
                <SectionReaders
                  count={presence?.perSection?.[index] ?? 0}
                  self={presence?.selfSection === index}
                />
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

const MAX_READER_DOTS = 5

function SectionReaders({ count, self }: { count: number; self: boolean }) {
  const palette = usePalette()
  const t = useTranslations('common')
  if (count === 0 && !self) return null
  return (
    <View style={styles.readers}>
      {Array.from({ length: Math.min(count, MAX_READER_DOTS) }, (_, i) => (
        <View
          key={i}
          style={[styles.readerDot, { backgroundColor: palette.neutral[6] }]}
        />
      ))}
      {self ? (
        <AppText color={palette.accent} style={styles.readerSelf}>
          {t('readingYou')}
        </AppText>
      ) : null}
    </View>
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
  headRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  readers: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    paddingTop: 7,
  },
  readerDot: {
    borderRadius: 3,
    height: 6,
    opacity: 0.5,
    width: 6,
  },
  readerSelf: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
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
