import { useRouter } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import { StyleSheet, View } from 'react-native'

import { AppText, Paper, SinkPressable } from '@/components/ui'
import type { Locale } from '@/i18n'
import {
  localeNames,
  locales,
  setLocale,
  useLocale,
  useTranslations,
} from '@/i18n'
import { syncAll } from '@/sync/engine'
import { usePalette } from '@/theme/palette'

export function LocaleSheet() {
  const t = useTranslations('me')
  const palette = usePalette()
  const router = useRouter()
  const current = useLocale()

  const choose = (locale: Locale) => {
    if (locale !== current) {
      setLocale(locale)
      void syncAll({ force: true })
    }
    router.back()
  }

  return (
    // RNScreens' formSheet blanks a ScrollView subtree, so this stays plain
    // views — five rows never need to scroll.
    <View style={[styles.sheet, { backgroundColor: palette.surface.desk }]}>
      <AppText style={styles.title} variant="entryTitle">
        {t('language')}
      </AppText>
      <Paper style={styles.card}>
        {locales.map((locale, index) => (
          <View key={locale}>
            {index > 0 ? (
              <View
                style={[
                  styles.hairline,
                  { backgroundColor: palette.neutral[4] },
                ]}
              />
            ) : null}
            <SinkPressable style={styles.row} onPress={() => choose(locale)}>
              <AppText variant="body">{localeNames[locale]}</AppText>
              {locale === current ? (
                <SymbolView
                  name="checkmark"
                  size={16}
                  tintColor={palette.accent}
                />
              ) : null}
            </SinkPressable>
          </View>
        ))}
      </Paper>
    </View>
  )
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    gap: 16,
  },
  title: {
    paddingHorizontal: 2,
  },
  card: {
    paddingHorizontal: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
  },
})
