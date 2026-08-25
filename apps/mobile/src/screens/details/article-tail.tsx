import { radius, type as typeScale } from '@yohaku/design-system/tokens'
import { SymbolView } from 'expo-symbols'
import { StyleSheet, View } from 'react-native'

import { useSession } from '@/auth/session-store'
import { AppText, SinkPressable, SlotText } from '@/components/ui'
import { useTranslations } from '@/i18n'
import { useLikeContent } from '@/interactions/use-like-content'
import { shareUrl } from '@/lib/share'
import { CommentSection } from '@/screens/comments/comment-section'
import {
  useIsActiveMember,
  useMembershipPlans,
} from '@/screens/me/use-membership'
import { useMembershipCheckout } from '@/screens/me/use-membership-checkout'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'

export function ArticleTail({
  kind,
  refId,
  likeCount,
  queriesEnabled = true,
  title,
  url,
}: {
  kind: 'post' | 'note'
  likeCount: number
  queriesEnabled?: boolean
  refId: string
  title?: string
  url: string
}) {
  const palette = usePalette()
  const t = useTranslations('common')
  const tm = useTranslations('membership')
  const session = useSession()
  const { data: plans } = useMembershipPlans(Boolean(session))
  const isMember = useIsActiveMember()
  const { present } = useMembershipCheckout()
  const { liked, like, pending } = useLikeContent(kind, refId)
  const showSupport =
    Boolean(session) && plans?.appleIap?.enabled === true && !isMember

  const outline = {
    backgroundColor: palette.surface.paper,
    borderColor: palette.neutral[3],
  }
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
          accessibilityLabel={t('like')}
          accessibilityRole="button"
          accessibilityState={{ selected: liked }}
          disabled={pending || liked}
          style={[styles.likePill, outline]}
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
        <SinkPressable
          accessibilityLabel={t('share')}
          accessibilityRole="button"
          style={[styles.share, outline]}
          onPress={() => void shareUrl(url, title)}
        >
          <SymbolView
            name="square.and.arrow.up"
            size={16}
            tintColor={palette.neutral[7]}
          />
        </SinkPressable>
        {showSupport ? (
          <SinkPressable
            accessibilityLabel={tm('support')}
            accessibilityRole="button"
            style={[styles.likePill, outline]}
            onPress={() => void present()}
          >
            <SymbolView
              name="heart.circle"
              size={16}
              tintColor={palette.accent}
            />
            <AppText color={palette.accent} variant="secondary">
              {tm('support')}
            </AppText>
          </SinkPressable>
        ) : null}
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  likePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: radius.pill,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 18,
    height: 40,
  },
  share: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
  },
  heart: {
    fontSize: 16,
    lineHeight: 20,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
  },
})
