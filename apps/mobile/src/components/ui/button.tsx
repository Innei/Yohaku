import { radius, type as typeScale } from '@yohaku/design-system/tokens'
import type { ReactNode } from 'react'
import { View } from 'react-native'

import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'
import { shadow } from '@/theme/surfaces'

import { AppText } from './app-text'
import type { SinkPressableProps } from './sink-pressable'
import { SinkPressable } from './sink-pressable'

export type ButtonVariant = 'ink' | 'paper' | 'quiet'

export interface ButtonProps extends SinkPressableProps {
  label: string
  variant?: ButtonVariant
}

export function Button({
  label,
  variant = 'ink',
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const palette = usePalette()

  const surface = {
    ink: {
      backgroundColor: palette.neutral[10],
      boxShadow: shadow.ink[palette.theme],
    },
    paper: {
      backgroundColor: palette.surface.paper,
      boxShadow: shadow.paperSmall[palette.theme],
    },
    quiet: {},
  }[variant]

  const labelColor = {
    ink: palette.neutral[1],
    paper: palette.neutral[9],
    quiet: palette.neutral[7],
  }[variant]

  return (
    <SinkPressable
      disabled={disabled}
      style={[
        {
          borderRadius: radius.control,
          borderCurve: 'continuous',
          paddingHorizontal: 22,
          height: 44,
          justifyContent: 'center',
          alignItems: 'center',
          alignSelf: 'flex-start',
          opacity: disabled ? 0.4 : 1,
        },
        surface,
        style,
      ]}
      {...rest}
    >
      <AppText
        color={labelColor}
        style={{
          ...fonts.sansMedium,
          fontSize: typeScale.copy15.size,
          lineHeight: typeScale.copy15.lineHeight,
        }}
      >
        {label}
      </AppText>
    </SinkPressable>
  )
}

export interface PillButtonProps extends SinkPressableProps {
  active?: boolean
  children?: ReactNode
  icon?: ReactNode
}

export function PillButton({
  active = false,
  icon,
  children,
  style,
  ...rest
}: PillButtonProps) {
  const palette = usePalette()

  return (
    <SinkPressable
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: palette.surface.paper,
          borderRadius: radius.pill,
          paddingHorizontal: 16,
          height: 36,
          boxShadow: shadow.paperSmall[palette.theme],
        },
        style,
      ]}
      {...rest}
    >
      {icon != null && (
        <View
          style={{
            height: typeScale.copy14.lineHeight,
            justifyContent: 'center',
          }}
        >
          {icon}
        </View>
      )}
      <AppText
        color={active ? palette.accent : palette.neutral[8]}
        style={{
          ...fonts.sansMedium,
          fontSize: typeScale.copy14.size,
          lineHeight: typeScale.copy14.lineHeight,
          fontVariant: ['tabular-nums'],
        }}
      >
        {children}
      </AppText>
    </SinkPressable>
  )
}
