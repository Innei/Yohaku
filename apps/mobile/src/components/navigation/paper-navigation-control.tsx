import { radius } from '@yohaku/design-system/tokens'
import { useCallback } from 'react'
import type { NativeSyntheticEvent } from 'react-native'
import { StyleSheet } from 'react-native'

import { usePalette } from '@/theme/palette'

import {
  NavigationHeaderControl,
  type NavigationHeaderMenuItem,
} from '../../../modules/yohaku'

export function PaperNavigationControl({
  accessibilityLabel,
  icon,
  identifier,
  menuItems = [],
  onMenuAction,
  onPress,
}: {
  accessibilityLabel: string
  icon: string
  identifier: string
  menuItems?: NavigationHeaderMenuItem[]
  onMenuAction?: (id: string) => void
  onPress?: () => void
}) {
  const palette = usePalette()
  const handleMenuAction = useCallback(
    (event: NativeSyntheticEvent<{ id: string }>) => {
      onMenuAction?.(event.nativeEvent.id)
    },
    [onMenuAction],
  )
  const handleNativePress = useCallback(() => {
    onPress?.()
  }, [onPress])

  return (
    <NavigationHeaderControl
      haptic
      controlIdentifier={identifier}
      controlKind={menuItems.length > 0 ? 'menu' : 'button'}
      controlLabel={accessibilityLabel}
      cornerRadius={radius.control}
      iconColor={palette.neutral[9]}
      iconName={icon}
      menuItems={menuItems}
      paperColor={palette.surface.paper}
      ringColor={palette.neutral[3]}
      shadowOpacity={palette.theme === 'dark' ? 0.32 : 0.1}
      style={styles.control}
      onMenuAction={handleMenuAction}
      onNativePress={handleNativePress}
    />
  )
}

const styles = StyleSheet.create({
  control: {
    height: 40,
    width: 40,
  },
})
