import { type as typeScale } from '@yohaku/design-system/tokens'
import { SymbolView } from 'expo-symbols'
import { type ReactNode, Fragment } from 'react'
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

export function PostMetaLine({
  hiddenCount = 0,
  post,
  tags,
  onCategoryPress,
  onTagPress,
}: {
  hiddenCount?: number
  onCategoryPress?: () => void
  onTagPress?: (tag: string) => void
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
          <NativePressable
            accessibilityRole="link"
            disabled={!onCategoryPress || !post.categorySlug}
            haptic={Boolean(onCategoryPress)}
            onPress={onCategoryPress}
          >
            <AppText color={palette.accent} variant="meta">
              {post.categoryName}
            </AppText>
          </NativePressable>
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
                  <NativePressable
                    accessibilityRole="link"
                    disabled={!onTagPress}
                    haptic={Boolean(onTagPress)}
                    onPress={() => onTagPress?.(tag)}
                  >
                    <AppText color={palette.accent} variant="meta">
                      {tag}
                    </AppText>
                  </NativePressable>
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

export function PostFeaturedTrigger({ post }: { post: PostRow }) {
  const t = useTranslations('list')
  const palette = usePalette()
  const summary = postListSummary(post, featuredSummaryChars)

  return (
    <>
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
    </>
  )
}

export function PostIndexTrigger({ post }: { post: PostRow }) {
  const palette = usePalette()
  const summary = postListSummary(post, indexSummaryChars)

  return (
    <>
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
    </>
  )
}

export function PostFeaturedSheet({
  post,
  trigger,
  onCategoryPress,
  onTagPress,
}: {
  onCategoryPress?: () => void
  onTagPress?: (tag: string) => void
  post: PostRow
  trigger: ReactNode
}) {
  const palette = usePalette()

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
      {trigger}
      <PostMetaLine
        onCategoryPress={onCategoryPress}
        onTagPress={onTagPress}
        post={post}
        tags={post.tags}
      />
      <PostCounts post={post} />
    </View>
  )
}

export function PostIndexItem({
  post,
  trigger,
  onCategoryPress,
  onTagPress,
}: {
  onCategoryPress?: () => void
  onTagPress?: (tag: string) => void
  post: PostRow
  trigger: ReactNode
}) {
  const { hiddenCount, visible } = partitionTags(post.tags)

  return (
    <View style={styles.item}>
      {trigger}
      <PostMetaLine
        hiddenCount={hiddenCount}
        onCategoryPress={onCategoryPress}
        onTagPress={onTagPress}
        post={post}
        tags={visible}
      />
    </View>
  )
}

export function PostRowPressable({
  children,
  disabled,
  ...pressableProps
}: Pick<NativePressableProps, 'onAccessibilityTap' | 'onPress'> & {
  children: ReactNode
  disabled?: boolean
}) {
  return (
    <NativePressable
      {...pressableProps}
      accessibilityRole="link"
      disabled={disabled}
    >
      {children}
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
