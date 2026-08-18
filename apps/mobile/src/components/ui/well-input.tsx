import { radius, type as typeScale } from '@yohaku/design-system/tokens'
import { useState } from 'react'
import type { TextInputProps } from 'react-native'
import { TextInput } from 'react-native'

import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'
import { shadow } from '@/theme/surfaces'

export function WellInput({ style, onFocus, onBlur, ...rest }: TextInputProps) {
  const palette = usePalette()
  const [focused, setFocused] = useState(false)

  const inset = shadow.wellInset[palette.theme]
  const ring = focused ? `, 0 0 0 1.5px ${palette.accent}` : ''

  return (
    <TextInput
      placeholderTextColor={palette.neutral[5]}
      selectionColor={palette.accent}
      style={[
        {
          backgroundColor: palette.surface.well,
          borderRadius: radius.field,
          borderCurve: 'continuous',
          paddingHorizontal: 16,
          paddingVertical: 13,
          ...fonts.sans,
          fontSize: typeScale.copy15.size,
          color: palette.neutral[9],
          boxShadow: `${inset}${ring}`,
        },
        style,
      ]}
      onBlur={(event) => {
        setFocused(false)
        onBlur?.(event)
      }}
      onFocus={(event) => {
        setFocused(true)
        onFocus?.(event)
      }}
      {...rest}
    />
  )
}
