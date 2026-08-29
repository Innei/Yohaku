import {
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native'

import { useTranslations } from '@/i18n'
import { usePalette } from '@/theme/palette'

export function BodyLoadingIndicator({ minHeight }: { minHeight: number }) {
  const t = useTranslations('detail')
  const palette = usePalette()

  return (
    <View
      accessible
      accessibilityLabel={t('bodyLoading')}
      accessibilityRole="progressbar"
      style={[styles.loading, { minHeight }]}
    >
      <ActivityIndicator color={palette.neutral[5]} />
    </View>
  )
}

/* Keep the tail below the fold while the WebView reports its real height. */
export function useReservedBodyHeight(slotTop?: number | null) {
  const { height } = useWindowDimensions()
  const top = slotTop ?? Math.round(height * 0.3)
  return Math.max(240, Math.round(height - top))
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    paddingTop: 48,
  },
})
