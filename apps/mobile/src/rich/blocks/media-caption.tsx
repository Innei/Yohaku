import { StyleSheet } from 'react-native'

import { AppText } from '@/components/ui'
import { usePalette } from '@/theme/palette'
import { useNativeSerifFontStyle } from '@/theme/serif-font'

export const MEDIA_RADIUS = 10

export function MediaCaption({ children }: { children: string }) {
  const palette = usePalette()
  const serif = useNativeSerifFontStyle()
  return (
    <AppText color={palette.neutral[6]} style={[styles.caption, serif]}>
      {children}
    </AppText>
  )
}

const styles = StyleSheet.create({
  caption: { fontSize: 13, lineHeight: 20, textAlign: 'center' },
})
