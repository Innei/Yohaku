import { type as typeScale } from '@yohaku/design-system/tokens'
import { useRouter } from 'expo-router'
import { StyleSheet, View } from 'react-native'

import { AppText, NativePressable } from '@/components/ui'
import type { PostRow } from '@/db/schema'
import { useLocale, useTranslations } from '@/i18n'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'

import { formatTaxonomyDate, visibleTaxonomyTags } from './taxonomy-model'

export function TaxonomyYearHead({
  count,
  later,
  visible,
  year,
}: {
  count: number
  later?: boolean
  visible: boolean
  year: number
}) {
  const t = useTranslations('taxonomy')
  const palette = usePalette()
  if (!visible) return null
  return (
    <View
      style={[
        styles.yearHead,
        { borderBottomColor: palette.neutral[3] },
        later ? styles.later : undefined,
      ]}
    >
      <View>
        <AppText
          color={palette.semantic.warning}
          style={styles.anno}
          variant="eyebrow"
        >
          Anno
        </AppText>
        <AppText style={styles.yearNum} variant="largeTitleSans">
          {year}
        </AppText>
      </View>
      <AppText style={styles.yearCount} variant="eyebrow">
        {t('entryCount', { count })}
      </AppText>
    </View>
  )
}

export function TaxonomyPostRow({
  includeYear,
  post,
  showCategorySource,
  onPress,
}: {
  includeYear: boolean
  post: PostRow
  showCategorySource: boolean
  onPress: () => void
}) {
  const locale = useLocale()
  const router = useRouter()
  const palette = usePalette()
  const { hiddenCount, visible } = visibleTaxonomyTags(post.tags)
  const date = formatTaxonomyDate(post.createdAt, locale, includeYear)

  return (
    <View style={styles.item}>
      <NativePressable accessibilityRole="link" onPress={onPress}>
        <AppText style={styles.title} variant="entryTitleSans">
          {post.title}
        </AppText>
      </NativePressable>
      <View style={styles.meta}>
        <NativePressable accessibilityRole="link" onPress={onPress}>
          <AppText variant="meta">{date}</AppText>
        </NativePressable>
        {showCategorySource && post.categoryName && post.categorySlug ? (
          <NativePressable
            accessibilityRole="link"
            onPress={() =>
              router.push({
                pathname: '/categories/[slug]',
                params: { slug: post.categorySlug! },
              })
            }
          >
            <AppText color={palette.accent} variant="meta">
              {post.categoryName}
            </AppText>
          </NativePressable>
        ) : null}
        {!showCategorySource
          ? visible.map((tag) => (
              <NativePressable
                accessibilityRole="link"
                key={tag}
                onPress={() =>
                  router.push({
                    pathname: '/posts/tag/[name]',
                    params: { name: tag },
                  })
                }
              >
                <AppText color={palette.accent} variant="meta">
                  #{tag}
                </AppText>
              </NativePressable>
            ))
          : null}
        {!showCategorySource && hiddenCount > 0 ? (
          <AppText color={palette.neutral[6]} variant="meta">
            {`+${hiddenCount}`}
          </AppText>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  yearHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 16,
    paddingBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  anno: {
    letterSpacing: 2.8,
  },
  yearNum: {
    marginTop: 2,
    fontSize: typeScale.display36.size,
    lineHeight: typeScale.display36.lineHeight,
    letterSpacing: -0.6,
  },
  yearCount: {
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  later: {
    marginTop: 32,
  },
  item: {
    paddingTop: 8,
    paddingBottom: 10,
  },
  title: {
    ...fonts.sansMedium,
    fontSize: typeScale.copy16.size,
    lineHeight: typeScale.copy16.lineHeight,
  },
  meta: {
    marginTop: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 6,
    rowGap: 2,
  },
})
