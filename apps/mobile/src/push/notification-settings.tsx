import { StyleSheet, Switch, View } from 'react-native'

import { AppText, Paper } from '@/components/ui'
import { useTranslations } from '@/i18n'
import type { Palette } from '@/theme/palette'
import { usePalette } from '@/theme/palette'

import {
  disablePush,
  enablePush,
  updatePushPreferences,
  usePushState,
} from './runtime'
import type { PushPreferences } from './types'

type PreferenceKey = keyof PushPreferences

const PREFERENCE_ROWS: { id: PreferenceKey; labelKey: PreferenceKey }[] = [
  { id: 'contentPost', labelKey: 'contentPost' },
  { id: 'contentNote', labelKey: 'contentNote' },
  { id: 'contentRecently', labelKey: 'contentRecently' },
  { id: 'commentReplied', labelKey: 'commentReplied' },
]

function ToggleRow({
  disabled,
  label,
  onValueChange,
  palette,
  value,
}: {
  disabled: boolean
  label: string
  onValueChange: (next: boolean) => void
  palette: Palette
  value: boolean
}) {
  return (
    <View style={styles.row}>
      <AppText style={styles.rowLabel} variant="body">
        {label}
      </AppText>
      <Switch
        disabled={disabled}
        ios_backgroundColor={palette.neutral[4]}
        thumbColor={palette.surface.paper}
        value={value}
        trackColor={{
          false: palette.neutral[4],
          true: palette.accent,
        }}
        onValueChange={onValueChange}
      />
    </View>
  )
}

export function NotificationSettings() {
  const t = useTranslations('push')
  const palette = usePalette()
  const push = usePushState()
  const preferencesDisabled = !push.enabled || push.working

  return (
    <View style={styles.section}>
      <AppText style={styles.sectionLabel} variant="entryTitleSans">
        {t('sectionTitle')}
      </AppText>
      <Paper style={styles.card}>
        <ToggleRow
          disabled={push.working}
          label={t('mainToggle')}
          palette={palette}
          value={push.enabled}
          onValueChange={(next) => {
            void (next ? enablePush() : disablePush())
          }}
        />
        {PREFERENCE_ROWS.map((row, index) => (
          <View key={row.id}>
            <View
              style={[styles.hairline, { backgroundColor: palette.neutral[4] }]}
            />
            <ToggleRow
              disabled={preferencesDisabled}
              label={t(row.labelKey)}
              palette={palette}
              value={push.preferences[row.id]}
              onValueChange={(next) => {
                void updatePushPreferences({ [row.id]: next })
              }}
            />
          </View>
        ))}
      </Paper>
      {push.error ? (
        <AppText style={styles.error} variant="body">
          {push.error}
        </AppText>
      ) : null}
      {!push.enabled && push.authorizationStatus === 1 ? (
        <AppText style={styles.hint} variant="body">
          {t('settingsDeniedHint')}
        </AppText>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  sectionLabel: {
    paddingHorizontal: 2,
  },
  card: {
    paddingHorizontal: 18,
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 46,
    gap: 12,
  },
  rowLabel: {
    flex: 1,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
  },
  error: {
    paddingHorizontal: 2,
    opacity: 0.8,
  },
  hint: {
    paddingHorizontal: 2,
    opacity: 0.7,
  },
})
