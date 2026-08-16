import { StyleSheet } from 'react-native'

import { AppText, SinkPressable } from '@/components/ui'
import { useTranslations } from '@/i18n'
import { usePalette } from '@/theme/palette'

export function ArticleListen({
  available,
  hidden,
  onPress,
}: {
  available: boolean
  hidden: boolean
  onPress: () => void
}) {
  const palette = usePalette()
  const t = useTranslations('tts')
  if (!available || hidden) return null
  return (
    <SinkPressable
      accessibilityLabel={t('narrate')}
      hitSlop={8}
      style={styles.hit}
      onPress={onPress}
    >
      <AppText color={palette.neutral[6]} variant="meta">
        {t('narrate')}
      </AppText>
    </SinkPressable>
  )
}

const styles = StyleSheet.create({
  hit: {
    alignSelf: 'flex-start',
    marginTop: 2,
    paddingVertical: 2,
  },
})
