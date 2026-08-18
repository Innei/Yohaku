import { radius } from '@yohaku/design-system/tokens'
import * as Linking from 'expo-linking'
import { SymbolView } from 'expo-symbols'
import { StyleSheet, View } from 'react-native'

import { AppText, Button } from '@/components/ui'
import { useTranslations } from '@/i18n'
import { usePalette } from '@/theme/palette'
import { shadow } from '@/theme/surfaces'

const wash = {
  light:
    'linear-gradient(135deg, rgba(197,100,115,0.05) 0%, rgba(255,228,180,0.07) 52%, rgba(197,100,115,0.025) 100%)',
  dark: 'linear-gradient(135deg, rgba(224,149,164,0.07) 0%, rgba(255,228,180,0.05) 52%, rgba(224,149,164,0.03) 100%)',
}

const bloom = {
  light:
    'radial-gradient(circle 150px at 88% -8%, rgba(255,228,180,0.16), rgba(255,228,180,0) 70%)',
  dark: 'radial-gradient(circle 150px at 88% -8%, rgba(255,228,180,0.10), rgba(255,228,180,0) 70%)',
}

export function PaywallGate({
  visible,
  webUrl,
}: {
  visible: boolean
  webUrl: string
}) {
  const t = useTranslations('membership')
  const palette = usePalette()

  if (!visible) return null

  return (
    <View style={styles.wrap}>
      <View style={styles.divider}>
        <View
          style={[styles.rule, { backgroundColor: palette.neutral[4] }]}
        />
        <AppText color={palette.neutral[6]} variant="eyebrow">
          {t('divider')}
        </AppText>
        <View
          style={[styles.rule, { backgroundColor: palette.neutral[4] }]}
        />
      </View>
      <View
        style={[
          styles.card,
          {
            backgroundColor: palette.surface.paper,
            boxShadow: shadow.paper[palette.theme],
          },
        ]}
      >
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { experimental_backgroundImage: wash[palette.theme] },
          ]}
        />
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { experimental_backgroundImage: bloom[palette.theme] },
          ]}
        />
        <View
          style={[styles.icon, { backgroundColor: `${palette.accent}1F` }]}
        >
          <SymbolView
            name="lock.fill"
            size={22}
            tintColor={palette.accent}
          />
        </View>
        <AppText style={styles.title} variant="entryTitleSans">
          {t('lockedTitle')}
        </AppText>
        <AppText style={styles.subtitle} variant="secondary">
          {t('lockedSubtitle')}
        </AppText>
        <Button
          accessibilityRole="link"
          label={t('ctaReadInSafari')}
          style={styles.cta}
          onPress={() => void Linking.openURL(webUrl)}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 16,
    paddingTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  card: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderRadius: radius.paper,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 260,
  },
  cta: {
    alignSelf: 'center',
    marginTop: 8,
    minWidth: 200,
  },
})
