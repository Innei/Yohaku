import { type as typeScale } from '@yohaku/design-system/tokens'
import { SymbolView } from 'expo-symbols'
import { Fragment } from 'react'
import { StyleSheet, View } from 'react-native'

import {
  AppText,
  NativePressable,
  type NativePressableProps,
} from '@/components/ui'
import type { PostRow } from '@/db/schema'
import { useLocale, useTranslations } from '@/i18n'
import { formatRelativeTime } from '@/lib/datetime'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'

import {
  featuredSummaryChars,
  indexSummaryChars,
  partitionTags,
  postListSummary,
} from './post-list'

function Dot() {
  const palette = usePalette()
  return (
    <AppText color={palette.neutral[4]} variant="meta">
      ·
    </AppText>
  )
}

function PostMetaLine({
  hiddenCount = 0,
  post,
  tags,
}: {
  hiddenCount?: number
  post: PostRow
  tags: string[]
}) {
  const locale = useLocale()
  const palette = usePalette()

  return (
    <View style={styles.metaRow}>
      <AppText variant="meta">
        {formatRelativeTime(post.createdAt, locale)}
      </AppText>
      {post.categoryName ? (
        <>
          <Dot />
          <AppText color={palette.accent} variant="meta">
            {post.categoryName}
          </AppText>
          {tags.length > 0 ? (
            <>
              <AppText color={palette.neutral[4]} variant="meta">
                /
              </AppText>
              {tags.map((tag, index) => (
                <Fragment key={tag}>
                  {index > 0 ? (
                    <AppText color={palette.neutral[4]} variant="meta">
                      ,
                    </AppText>
                  ) : null}
                  <AppText color={palette.accent} variant="meta">
                    {tag}
                  </AppText>
                </Fragment>
              ))}
              {hiddenCount > 0 ? (
                <AppText color={palette.neutral[6]} variant="meta">
                  {`+${hiddenCount}`}
                </AppText>
              ) : null}
            </>
          ) : null}
        </>
      ) : null}
    </View>
  )
}

function PostCounts({ post }: { post: PostRow }) {
  const palette = usePalette()
  if (post.readCount <= 0 && post.likeCount <= 0) return null
  return (
    <View style={styles.counts}>
      <View
        style={[
          styles.countRule,
          { backgroundColor: `${palette.neutral[10]}1f` },
        ]}
      />
      {post.readCount > 0 ? (
        <View style={styles.count}>
          <SymbolView name="eye" size={12} tintColor={palette.neutral[5]} />
          <AppText variant="meta">{post.readCount}</AppText>
        </View>
      ) : null}
      {post.likeCount > 0 ? (
        <View style={styles.count}>
          <SymbolView name="heart" size={12} tintColor={palette.neutral[5]} />
          <AppText variant="meta">{post.likeCount}</AppText>
        </View>
      ) : null}
    </View>
  )
}

export function PostFeaturedSheet({
  post,
  ...pressableProps
}: Pick<NativePressableProps, 'onAccessibilityTap' | 'onPress'> & {
  post: PostRow
}) {
  const t = useTranslations('list')
  const palette = usePalette()
  const summary = postListSummary(post, featuredSummaryChars)

  return (
    <NativePressable
      {...pressableProps}
      accessibilityRole="link"
      disabled={!post.categorySlug}
    >
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: palette.surface.paper,
            borderColor: `${palette.neutral[10]}0f`,
          },
        ]}
      >
        <AppText color={palette.accent} style={styles.pin} variant="meta">
          {t('pinned')}
        </AppText>
        <AppText style={styles.listTitle} variant="entryTitleSans">
          {post.title}
        </AppText>
        {summary ? (
          <AppText
            color={palette.neutral[6]}
            numberOfLines={2}
            style={styles.featuredSummary}
            variant="secondary"
          >
            {summary}
          </AppText>
        ) : null}
        <PostMetaLine post={post} tags={post.tags} />
        <PostCounts post={post} />
      </View>
    </NativePressable>
  )
}

export function PostIndexItem({
  post,
  ...pressableProps
}: Pick<NativePressableProps, 'onAccessibilityTap' | 'onPress'> & {
  post: PostRow
}) {
  const palette = usePalette()
  const summary = postListSummary(post, indexSummaryChars)
  const { hiddenCount, visible } = partitionTags(post.tags)

  return (
    <NativePressable
      {...pressableProps}
      accessibilityRole="link"
      disabled={!post.categorySlug}
      style={styles.item}
    >
      <AppText style={styles.listTitle} variant="entryTitleSans">
        {post.title}
      </AppText>
      {summary ? (
        <AppText
          color={palette.neutral[6]}
          numberOfLines={1}
          style={styles.itemSummary}
          variant="secondary"
        >
          {summary}
        </AppText>
      ) : null}
      <PostMetaLine hiddenCount={hiddenCount} post={post} tags={visible} />
    </NativePressable>
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
  },
  pin: {
    letterSpacing: 1,
    marginBottom: 6,
  },
  listTitle: {
    ...fonts.sansMedium,
    fontSize: typeScale.copy16.size,
    lineHeight: typeScale.copy16.lineHeight,
  },
  featuredSummary: {
    marginTop: 8,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 6,
    rowGap: 2,
    marginTop: 10,
  },
  counts: {
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    paddingTop: 8,
  },
  countRule: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: StyleSheet.hairlineWidth,
  },
  count: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  item: {
    paddingTop: 12,
    paddingBottom: 11,
  },
  itemSummary: {
    marginTop: 4,
  },
})
