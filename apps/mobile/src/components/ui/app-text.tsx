import type { NeutralStep, TypeRole } from '@yohaku/design-system/tokens'
import { type as typeScale } from '@yohaku/design-system/tokens'
import type { TextProps } from 'react-native'
import { StyleSheet, Text, useWindowDimensions } from 'react-native'

import type { FontStyle } from '@/theme/font-faces'
import { clampFontScale } from '@/theme/font-scale'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'
import { useNativeSerifFontStyle } from '@/theme/serif-font'

export type TextRole =
  | 'largeTitle'
  | 'largeTitleSans'
  | 'entryTitle'
  | 'entryTitleSans'
  | 'letterTitle'
  | 'body'
  | 'secondary'
  | 'meta'
  | 'eyebrow'

interface RoleSpec {
  font: FontStyle
  letterSpacing?: number
  scale: TypeRole
  step: NeutralStep
}

const roles: Record<TextRole, RoleSpec> = {
  largeTitle: { font: fonts.serif, scale: 'title28', step: 10 },
  largeTitleSans: { font: fonts.sansMedium, scale: 'title28', step: 10 },
  entryTitle: { font: fonts.serif, scale: 'title20', step: 9 },
  entryTitleSans: { font: fonts.sansMedium, scale: 'title20', step: 9 },
  letterTitle: { font: fonts.serif, scale: 'copy16', step: 9 },
  body: { font: fonts.sans, scale: 'copy16', step: 9 },
  secondary: { font: fonts.sans, scale: 'copy13', step: 7 },
  meta: { font: fonts.sans, scale: 'label12', step: 6 },
  eyebrow: { font: fonts.sans, scale: 'caption10', step: 6, letterSpacing: 3 },
}

const serifRoles = new Set<TextRole>([
  'largeTitle',
  'entryTitle',
  'letterTitle',
])

export interface AppTextProps extends TextProps {
  color?: string
  variant?: TextRole
}

export function AppText({
  variant = 'body',
  color,
  style,
  ...rest
}: AppTextProps) {
  const palette = usePalette()
  const serifFont = useNativeSerifFontStyle()
  const spec = roles[variant]
  const scale = typeScale[spec.scale]
  const fontScale = clampFontScale(useWindowDimensions().fontScale)
  const override = StyleSheet.flatten(style)
  const fontSize =
    (typeof override?.fontSize === 'number' ? override.fontSize : scale.size) *
    fontScale
  const lineHeight =
    (typeof override?.lineHeight === 'number'
      ? override.lineHeight
      : scale.lineHeight) * fontScale

  return (
    <Text
      allowFontScaling={false}
      style={[
        {
          ...spec.font,
          ...(serifRoles.has(variant) ? serifFont : null),
          color: color ?? palette.neutral[spec.step],
          letterSpacing: spec.letterSpacing,
        },
        override,
        { fontSize, lineHeight },
      ]}
      {...rest}
    />
  )
}
