import { radius } from '@yohaku/design-system/tokens'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

import { useLogin } from '@/auth/use-login'
import { AppText } from '@/components/ui'
import { useTranslations } from '@/i18n'
import { ProviderButton } from '@/screens/me/provider-button'
import { hasProviderIcon } from '@/screens/me/provider-icon'
import { usePalette } from '@/theme/palette'
import { shadow } from '@/theme/surfaces'

export function CommentLoginInline({ enabled = true }: { enabled?: boolean }) {
  const t = useTranslations('auth')
  const palette = usePalette()
  const { providers, busy, signInSocial } = useLogin(enabled)

  const social = providers?.filter((p) => hasProviderIcon(p))

  return (
    <View
      style={[
        styles.well,
        {
          backgroundColor: palette.surface.well,
          boxShadow: shadow.wellInset[palette.theme],
        },
      ]}
    >
      {social === undefined ? (
        <ActivityIndicator color={palette.neutral[6]} />
      ) : social.length > 0 ? (
        <>
          <AppText
            color={palette.neutral[7]}
            numberOfLines={1}
            style={styles.cta}
            variant="secondary"
          >
            {t('signInPitch')}
          </AppText>
          <View style={styles.providerRow}>
            {social.map((provider) => (
              <ProviderButton
                busy={busy?.kind === 'social' && busy.provider === provider}
                key={provider}
                provider={provider}
                size={28}
                dimmed={
                  busy !== null &&
                  !(busy.kind === 'social' && busy.provider === provider)
                }
                onPress={() => void signInSocial(provider)}
              />
            ))}
          </View>
        </>
      ) : (
        <AppText
          color={palette.neutral[6]}
          numberOfLines={1}
          variant="secondary"
        >
          {t('socialUnavailable')}
        </AppText>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  well: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderRadius: radius.field,
    borderCurve: 'continuous',
    paddingHorizontal: 12,
  },
  cta: {
    flex: 1,
    flexShrink: 1,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
})
