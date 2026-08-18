import { radius, type as typeScale } from '@yohaku/design-system/tokens'
import { StyleSheet, View } from 'react-native'

import { AppText, SinkPressable, SlotText } from '@/components/ui'
import { useLikeContent } from '@/interactions/use-like-content'
import { CommentSection } from '@/screens/comments/comment-section'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'
import { shadow } from '@/theme/surfaces'

export function ArticleTail({
  kind,
  refId,
  likeCount,
  queriesEnabled = true,
}: {
  kind: 'post' | 'note'
  likeCount: number
  queriesEnabled?: boolean
  refId: string
}) {
  const palette = usePalette()
  const { liked, like, pending } = useLikeContent(kind, refId)

  const countStyle = {
    ...fonts.sansMedium,
    fontSize: typeScale.copy14.size,
    lineHeight: typeScale.copy14.lineHeight,
    color: liked ? palette.accent : palette.neutral[8],
  }

  return (
    <View style={styles.tail}>
      <View style={styles.actionRow}>
        <SinkPressable
          disabled={pending || liked}
          style={[
            styles.likePill,
            {
              backgroundColor: palette.surface.paper,
              boxShadow: shadow.paperSmall[palette.theme],
            },
          ]}
          onPress={() => void like()}
        >
          <AppText
            color={liked ? palette.accent : palette.neutral[7]}
            style={styles.heart}
          >
            {liked ? '♥' : '♡'}
          </AppText>
          <SlotText textStyle={countStyle} value={likeCount} />
        </SinkPressable>
      </View>
      <View
        style={[styles.hairline, { backgroundColor: palette.neutral[3] }]}
      />
      <CommentSection
        queriesEnabled={queriesEnabled}
        refId={refId}
        refType={kind}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  tail: {
    gap: 20,
    marginTop: 12,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  likePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: radius.pill,
    borderCurve: 'continuous',
    paddingHorizontal: 18,
    height: 40,
  },
  heart: {
    fontSize: 16,
    lineHeight: 20,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
  },
})
