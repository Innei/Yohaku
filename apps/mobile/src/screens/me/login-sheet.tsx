import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

import { useLogin } from '@/auth/use-login'
import { useRouteTransitionSettled } from '@/components/navigation/use-route-transition-settled'
import { AppText, Button, SinkPressable, WellInput } from '@/components/ui'
import { useTranslations } from '@/i18n'
import { getPrivacyUrl, siteHref } from '@/lib/site-url'
import { usePalette } from '@/theme/palette'

import { ProviderButton } from './provider-button'
import { hasProviderIcon } from './provider-icon'

const brandMark = {
  light: require('../../../assets/images/splash-icon.png'),
  dark: require('../../../assets/images/splash-icon-dark.png'),
}

export function LoginSheet() {
  const t = useTranslations('auth')
  const palette = usePalette()
  const router = useRouter()
  const queriesEnabled = useRouteTransitionSettled('login')
  const { providers, busy, signInSocial, signInEmail } =
    useLogin(queriesEnabled)
  const [mode, setMode] = useState<'social' | 'email'>('social')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  const social = providers?.filter((p) => hasProviderIcon(p))
  const locked = busy !== null
  const termsUrl = siteHref('/terms')
  const privacyUrl = getPrivacyUrl()

  useEffect(() => {
    if (social?.length === 0) setMode('email')
  }, [social?.length])

  const onSocial = async (provider: string) => {
    if (!acceptedTerms) return
    if (await signInSocial(provider)) router.back()
  }

  const onEmail = async () => {
    if (!acceptedTerms) return
    setEmailError(false)
    if (await signInEmail(email.trim(), password)) {
      router.back()
      return
    }
    setEmailError(true)
  }

  return (
    // RNScreens' formSheet applies a special zero-height layout path to a
    // ScrollView subtree, blanking the sheet — keep this plain views only.
    <View style={[styles.sheet, { backgroundColor: palette.surface.desk }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Image source={brandMark[palette.theme]} style={styles.mark} />
          <AppText variant="entryTitle">{t('sheetTitle')}</AppText>
          <AppText variant="secondary">{t('sheetSubtitle')}</AppText>
        </View>

        {mode === 'social' ? (
          <>
            {social === undefined ? (
              <View style={styles.providerRow}>
                <ActivityIndicator color={palette.neutral[6]} />
              </View>
            ) : social.length > 0 ? (
              <View style={styles.providerRow}>
                {social.map((provider) => (
                  <ProviderButton
                    busy={busy?.kind === 'social' && busy.provider === provider}
                    key={provider}
                    provider={provider}
                    dimmed={
                      !acceptedTerms ||
                      (busy !== null &&
                        !(busy.kind === 'social' && busy.provider === provider))
                    }
                    onPress={() => void onSocial(provider)}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.providerRow}>
                <AppText color={palette.neutral[6]} variant="secondary">
                  {t('socialUnavailable')}
                </AppText>
              </View>
            )}
            <SinkPressable
              disabled={locked}
              style={styles.emailLink}
              onPress={() => {
                setEmailError(false)
                setMode('email')
              }}
            >
              <AppText color={palette.neutral[6]} variant="meta">
                {t('emailLogin')}
              </AppText>
            </SinkPressable>
          </>
        ) : (
          <View pointerEvents={locked ? 'none' : 'auto'} style={styles.form}>
            <WellInput
              autoCapitalize="none"
              autoCorrect={false}
              editable={!locked}
              keyboardType="email-address"
              placeholder={t('email')}
              textContentType="username"
              value={email}
              onChangeText={setEmail}
            />
            <WellInput
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!locked}
              placeholder={t('password')}
              textContentType="password"
              value={password}
              onChangeText={setPassword}
            />
            <Button
              label={t('signIn')}
              style={styles.submit}
              disabled={
                locked ||
                !acceptedTerms ||
                email.trim().length === 0 ||
                password.length === 0
              }
              onPress={() => void onEmail()}
            />
            {emailError ? (
              <AppText color={palette.semantic.error} variant="meta">
                {t('emailFailed')}
              </AppText>
            ) : null}
            <SinkPressable
              disabled={locked}
              style={styles.emailLink}
              onPress={() => {
                setEmailError(false)
                setMode('social')
              }}
            >
              <AppText color={palette.neutral[6]} variant="meta">
                {t('backToSocial')}
              </AppText>
            </SinkPressable>
          </View>
        )}

        <View style={styles.agreement}>
          <SinkPressable
            accessibilityLabel={t('termsAgreement')}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: acceptedTerms }}
            disabled={locked}
            style={[
              styles.checkbox,
              {
                backgroundColor: acceptedTerms
                  ? palette.neutral[10]
                  : 'transparent',
                borderColor: acceptedTerms
                  ? palette.neutral[10]
                  : palette.neutral[5],
              },
            ]}
            onPress={() => setAcceptedTerms((current) => !current)}
          >
            <AppText color={palette.neutral[1]} variant="meta">
              {acceptedTerms ? '✓' : ''}
            </AppText>
          </SinkPressable>
          <View style={styles.agreementCopy}>
            <SinkPressable
              disabled={locked}
              onPress={() => setAcceptedTerms((current) => !current)}
            >
              <AppText color={palette.neutral[7]} variant="meta">
                {t('termsAgreement')}
              </AppText>
            </SinkPressable>
            <View style={styles.policyLinks}>
              <SinkPressable
                onPress={() => void WebBrowser.openBrowserAsync(termsUrl)}
              >
                <AppText color={palette.accent} variant="meta">
                  {t('termsOfUse')}
                </AppText>
              </SinkPressable>
              {privacyUrl ? (
                <SinkPressable
                  onPress={() => void WebBrowser.openBrowserAsync(privacyUrl)}
                >
                  <AppText color={palette.accent} variant="meta">
                    {t('privacyPolicy')}
                  </AppText>
                </SinkPressable>
              ) : null}
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 40,
    gap: 28,
  },
  header: {
    alignItems: 'center',
    gap: 6,
  },
  mark: {
    width: 44,
    height: 44,
    marginBottom: 8,
  },
  providerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    minHeight: 52,
    alignItems: 'center',
  },
  emailLink: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  form: {
    gap: 12,
  },
  agreement: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
  },
  agreementCopy: {
    flex: 1,
    gap: 6,
  },
  checkbox: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  policyLinks: {
    flexDirection: 'row',
    gap: 16,
  },
  submit: {
    alignSelf: 'stretch',
    marginTop: 4,
  },
})
