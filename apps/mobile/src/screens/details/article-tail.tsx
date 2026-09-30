import { radius, type as typeScale } from '@yohaku/design-system/tokens'
import { SymbolView } from 'expo-symbols'
import { StyleSheet, View } from 'react-native'

import { useSession } from '@/auth/session-store'
import { AppText, SinkPressable, SlotText } from '@/components/ui'
import { useLocale, useTranslations } from '@/i18n'
import { useLikeContent } from '@/interactions/use-like-content'
import { shareUrl } from '@/lib/share'
import { CommentSection } from '@/screens/comments/comment-section'
import {
  useIsActiveMember,
  useMembershipPlans,
} from '@/screens/me/use-membership'
import { useMembershipCheckout } from '@/screens/me/use-membership-checkout'
import { usePalette } from '@/theme/palette'

import { LikeSeal } from './like-seal'
import { type SealCaption, sealCaption } from './seal-caption'

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
  const locale = useLocale()
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

  return (
    <View style={styles.tail}>
      <View style={styles.stamp}>
        <View style={styles.actionRow}>
          <SinkPressable
            accessibilityLabel={t('share')}
            accessibilityRole="button"
            style={[styles.round, outline]}
            onPress={() => void shareUrl(url, title)}
          >
            <SymbolView
              name="square.and.arrow.up"
              size={17}
              tintColor={palette.neutral[7]}
            />
          </SinkPressable>
          <LikeSeal
            disabled={pending || liked}
            liked={liked}
            onPress={() => void like()}
          />
          {showSupport ? (
            <SinkPressable
              accessibilityLabel={tm('support')}
              accessibilityRole="button"
              style={[styles.round, outline]}
              onPress={() => void present()}
            >
              <SymbolView
                name="heart.circle"
                size={19}
                tintColor={palette.accent}
              />
            </SinkPressable>
          ) : null}
        </View>
        <SealCaptionLine
          caption={sealCaption(locale, likeCount, liked, !pending)}
        />
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

function SealCaptionLine({ caption }: { caption: SealCaption | null }) {
  const palette = usePalette()
  const textStyle = {
    color: palette.neutral[6],
    fontSize: typeScale.label12.size,
    lineHeight: typeScale.label12.lineHeight,
  }
  return (
    <View
      accessible
      style={[styles.caption, { minHeight: typeScale.label12.lineHeight }]}
      accessibilityLabel={
        caption ? `${caption.lead}${caption.number ?? ''}${caption.tail}` : undefined
      }
    >
      {caption ? (
        <>
          <AppText style={textStyle}>{caption.lead}</AppText>
          {caption.number === null ? null : (
            <SlotText textStyle={textStyle} value={caption.number} />
          )}
          <AppText style={textStyle}>{caption.tail}</AppText>
        </>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  tail: {
    gap: 20,
    marginTop: 12,
  },
  stamp: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  caption: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  round: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
  },
})
