import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

import { useLogin } from '@/auth/use-login'
import { useRouteTransitionSettled } from '@/components/navigation/use-route-transition-settled'
import { AppText, Button, SinkPressable, WellInput } from '@/components/ui'
import { showToast } from '@/components/ui/toast-store'
import { useTranslations } from '@/i18n'
import { openExternalUrl } from '@/lib/open-external'
import { getPrivacyUrl, getSiteUrl, siteHref } from '@/lib/site-url'
import { usePalette } from '@/theme/palette'

import { ProviderButton } from './provider-button'
import { hasProviderIcon } from './provider-icon'

function siteLabelFrom(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

const brandMark = {
  light: require('../../../assets/images/splash-icon.png'),
  dark: require('../../../assets/images/splash-icon-dark.png'),
}

export function LoginSheet() {
  const t = useTranslations('auth')
  const tc = useTranslations('common')
  const palette = usePalette()
  const router = useRouter()
  const queriesEnabled = useRouteTransitionSettled('login')
  const { providers, busy, lastError, signInSocial, signInEmail } =
    useLogin(queriesEnabled)
  const [mode, setMode] = useState<'social' | 'email'>('social')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [termsHint, setTermsHint] = useState(false)

  const social = providers?.filter((p) => hasProviderIcon(p))
  const locked = busy !== null
  const siteLabel = siteLabelFrom(getSiteUrl())
  const termsUrl = siteHref('/terms')
  const privacyUrl = getPrivacyUrl()

  useEffect(() => {
    if (social?.length === 0) setMode('email')
  }, [social?.length])

  /**
   * The agreement gate used to return silently, which on Android looked like a
   * dead button. Every blocked tap now explains itself.
   */
  const requireTerms = () => {
    if (acceptedTerms) return true
    setTermsHint(true)
    showToast(t('termsRequired'))
    return false
  }

  const onSocial = async (provider: string) => {
    if (locked) return
    if (!requireTerms()) return
    const ok = await signInSocial(provider)
    if (ok) router.back()
  }

  const onEmail = async () => {
    if (!requireTerms()) return
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
          <Image
            pointerEvents="none"
            source={brandMark[palette.theme]}
            style={styles.mark}
          />
          <AppText variant="entryTitle">
                {t('sheetTitle', { site: siteLabel })}
              </AppText>
          <AppText variant="secondary">{t('sheetSubtitle')}</AppText>
        </View>

        {lastError ? (
          <AppText
            color={palette.semantic.error}
            numberOfLines={2}
            style={styles.status}
            variant="meta"
          >
            {lastError}
          </AppText>
        ) : null}

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
              label={busy?.kind === 'email' ? tc('loading') : t('signIn')}
              style={styles.submit}
              disabled={
                locked ||
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
                borderColor: termsHint && !acceptedTerms
                  ? palette.accent
                  : acceptedTerms
                    ? palette.neutral[10]
                    : palette.neutral[5],
              },
            ]}
            onPress={() => {
              setTermsHint(false)
              setAcceptedTerms((current) => !current)
            }}
          >
            <AppText color={palette.neutral[1]} variant="meta">
              {acceptedTerms ? '✓' : ''}
            </AppText>
          </SinkPressable>
          <View style={styles.agreementCopy}>
            <SinkPressable
              disabled={locked}
              onPress={() => {
                setTermsHint(false)
                setAcceptedTerms((current) => !current)
              }}
            >
              <AppText
                color={termsHint && !acceptedTerms ? palette.accent : palette.neutral[7]}
                variant="meta"
              >
                {t('termsAgreement')}
              </AppText>
            </SinkPressable>
            <View style={styles.policyLinks}>
              <SinkPressable
                onPress={() => void openExternalUrl(termsUrl)}
              >
                <AppText color={palette.accent} variant="meta">
                  {t('termsOfUse')}
                </AppText>
              </SinkPressable>
              {privacyUrl ? (
                <SinkPressable
                  onPress={() => void openExternalUrl(privacyUrl)}
                >
                  <AppText color={palette.accent} variant="meta">
                    {t('privacyPolicy')}
                  </AppText>
                </SinkPressable>
              ) : null}
            </View>
          </View>
        </View>
        {termsHint && !acceptedTerms ? (
          <AppText
            color={palette.accent}
            style={styles.termsHint}
            variant="meta"
          >
            {t('termsRequired')}
          </AppText>
        ) : null}
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
  status: {
    marginTop: -12,
    textAlign: 'center',
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
  termsHint: {
    marginTop: -20,
    paddingLeft: 32,
  },
  submit: {
    alignSelf: 'stretch',
    marginTop: 4,
  },
})
