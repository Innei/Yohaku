import { type as typeScale } from '@yohaku/design-system/tokens'
import { useRouter } from 'expo-router'
import { StyleSheet, View } from 'react-native'

import { AppText, NativePressable } from '@/components/ui'
import type { PostRow } from '@/db/schema'
import { useLocale, useTranslations } from '@/i18n'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'

import { postListSummary } from '../lists/post-list'
import { formatTaxonomyDate, visibleTaxonomyTags } from './taxonomy-model'

export function TaxonomyPinned({
  includeYear,
  post,
  onPress,
}: {
  includeYear: boolean
  post: PostRow
  onPress: () => void
}) {
  const locale = useLocale()
  const router = useRouter()
  const t = useTranslations('list')
  const palette = usePalette()
  const summary = postListSummary(post, 150)
  const { hiddenCount, visible } = visibleTaxonomyTags(post.tags)

  return (
    <View
      style={[
        styles.sheet,
        {
          backgroundColor: palette.surface.paper,
          borderColor: `${palette.neutral[10]}0f`,
        },
      ]}
    >
      <NativePressable accessibilityRole="link" onPress={onPress}>
        <AppText color={palette.accent} style={styles.pin} variant="meta">
          {t('pinned')}
        </AppText>
        <AppText style={styles.title} variant="entryTitleSans">
          {post.title}
        </AppText>
        {summary ? (
          <AppText
            color={palette.neutral[6]}
            numberOfLines={2}
            style={styles.summary}
            variant="secondary"
          >
            {summary}
          </AppText>
        ) : null}
      </NativePressable>
      <View style={styles.meta}>
        <NativePressable accessibilityRole="link" onPress={onPress}>
          <AppText variant="meta">
            {formatTaxonomyDate(post.createdAt, locale, includeYear)}
          </AppText>
        </NativePressable>
        {visible.map((tag) => (
          <NativePressable
            key={tag}
            accessibilityRole="link"
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
        ))}
        {hiddenCount > 0 ? (
          <AppText color={palette.neutral[6]} variant="meta">
            {`+${hiddenCount}`}
          </AppText>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  sheet: {
    borderRadius: 10,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    marginBottom: 8,
  },
  pin: {
    letterSpacing: 1,
    marginBottom: 6,
  },
  title: {
    ...fonts.sansMedium,
    fontSize: typeScale.copy16.size,
    lineHeight: typeScale.copy16.lineHeight,
  },
  summary: {
    marginTop: 8,
    lineHeight: 20,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 6,
    rowGap: 2,
    marginTop: 10,
  },
})
