import { ActivityIndicator, StyleSheet, View } from 'react-native'

import { useLogin } from '@/auth/use-login'
import { AppText, SinkPressable } from '@/components/ui'
import { useTranslations } from '@/i18n'
import { hasProviderIcon, ProviderIcon } from '@/screens/me/provider-icon'
import { usePalette } from '@/theme/palette'

const PROVIDER_NAMES: Record<string, string> = {
  apple: 'Apple',
  github: 'GitHub',
  google: 'Google',
}

export function CommentLoginInline({ enabled = true }: { enabled?: boolean }) {
  const t = useTranslations('auth')
  const palette = usePalette()
  const { providers, busy, signInSocial } = useLogin(enabled)

  const social = providers?.filter((p) => hasProviderIcon(p))

  if (social === undefined) {
    return <ActivityIndicator color={palette.neutral[6]} style={styles.loading} />
  }
  if (social.length === 0) {
    return (
      <AppText color={palette.neutral[6]} variant="secondary">
        {t('socialUnavailable')}
      </AppText>
    )
  }

  return (
    <View style={styles.root}>
      <AppText color={palette.neutral[6]} variant="secondary">
        {t('signInPitch')}
      </AppText>
      <View style={styles.row}>
        {social.map((provider) => {
          const loading = busy?.kind === 'social' && busy.provider === provider
          return (
            <SinkPressable
              accessibilityLabel={PROVIDER_NAMES[provider] ?? provider}
              accessibilityRole="button"
              disabled={busy !== null}
              key={provider}
              style={[
                styles.pill,
                {
                  backgroundColor: palette.surface.paper,
                  borderColor: palette.neutral[3],
                  opacity: busy !== null && !loading ? 0.4 : 1,
                },
              ]}
              onPress={() => void signInSocial(provider)}
            >
              {loading ? (
                <ActivityIndicator color={palette.neutral[7]} size="small" />
              ) : (
                <ProviderIcon
                  color={palette.neutral[9]}
                  provider={provider}
                  size={16}
                />
              )}
              <AppText style={styles.label} variant="body">
                {PROVIDER_NAMES[provider] ?? provider}
              </AppText>
            </SinkPressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { gap: 10 },
  loading: { alignSelf: 'flex-start' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    height: 40,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 20,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
})
