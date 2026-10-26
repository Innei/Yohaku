import { type as typeScale } from '@yohaku/design-system/tokens'
import * as Haptics from 'expo-haptics'
import { SymbolView } from 'expo-symbols'
import { StyleSheet, View } from 'react-native'

import { useSession } from '@/auth/session-store'
import { AppText, SinkPressable, SlotText } from '@/components/ui'
import { useTranslations } from '@/i18n'
import { useLikeContent } from '@/interactions/use-like-content'
import { CommentSection } from '@/screens/comments/comment-section'
import {
  useIsActiveMember,
  useMembershipPlans,
} from '@/screens/me/use-membership'
import { useMembershipCheckout } from '@/screens/me/use-membership-checkout'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'
import { useNativeSerifFontStyle } from '@/theme/serif-font'

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
  const t = useTranslations('common')
  const tm = useTranslations('membership')
  const serif = useNativeSerifFontStyle()
  const session = useSession()
  const { data: plans } = useMembershipPlans(Boolean(session))
  const isMember = useIsActiveMember()
  const { present } = useMembershipCheckout()
  const { liked, like, pending } = useLikeContent(kind, refId)
  const showSupport =
    Boolean(session) && plans?.appleIap?.enabled === true && !isMember
  const count = likeCount + (liked && pending ? 1 : 0)
  const countText = t('likeCount', { count })
  const label = count > 0 ? `${t('like')} ${countText}` : t('like')
  const countStyle = {
    ...fonts.mono,
    color: liked ? palette.accent : palette.neutral[6],
    fontSize: 11,
    lineHeight: 14,
  }

  return (
    <View style={styles.tail}>
      <View style={styles.plate}>
        <SinkPressable
          accessibilityLabel={label}
          accessibilityRole="button"
          accessibilityState={{ disabled: pending || liked, selected: liked }}
          disabled={pending || liked}
          haptic={false}
          style={styles.like}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
            void like()
          }}
        >
          <SymbolView
            name={liked ? 'heart.fill' : 'heart'}
            size={14}
            tintColor={liked ? palette.accent : palette.neutral[6]}
          />
          <AppText style={[styles.word, serif]}>{t('like')}</AppText>
          {count > 0 ? (
            <>
              <View
                style={[
                  styles.leader,
                  { borderColor: liked ? palette.accent : palette.neutral[4] },
                  liked ? styles.leaderLiked : null,
                ]}
              />
              <SlotText textStyle={countStyle} value={countText} />
            </>
          ) : null}
        </SinkPressable>
        {showSupport ? (
          <SinkPressable
            accessibilityLabel={tm('support')}
            accessibilityRole="button"
            style={styles.supportPress}
            onPress={() => void present()}
          >
            <AppText color={palette.neutral[7]} style={styles.support}>
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
  plate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minHeight: 66,
  },
  like: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    minHeight: 44,
  },
  word: {
    fontSize: typeScale.copy15.size,
    lineHeight: typeScale.copy15.lineHeight,
  },
  leader: {
    flex: 1,
    height: 1,
    marginHorizontal: 2,
    borderBottomWidth: 1,
    borderStyle: 'dotted',
  },
  leaderLiked: {
    opacity: 0.5,
  },
  supportPress: {
    justifyContent: 'center',
    minHeight: 44,
  },
  support: {
    fontSize: typeScale.label12.size,
    lineHeight: typeScale.label12.lineHeight,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
  },
})
