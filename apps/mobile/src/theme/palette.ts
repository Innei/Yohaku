import type { ThemeName } from '@yohaku/design-system/tokens'
import {
  accent,
  neutral,
  semantic,
  surface,
} from '@yohaku/design-system/tokens'
import { useColorScheme } from 'react-native'

export interface Palette {
  accent: string
  neutral: (typeof neutral)[ThemeName]
  semantic: (typeof semantic)[ThemeName]
  surface: (typeof surface)[ThemeName]
  theme: ThemeName
}

const palettes: Record<ThemeName, Palette> = {
  light: {
    theme: 'light',
    neutral: neutral.light,
    accent: accent.light,
    semantic: semantic.light,
    surface: surface.light,
  },
  dark: {
    theme: 'dark',
    neutral: neutral.dark,
    accent: accent.dark,
    semantic: semantic.dark,
    surface: surface.dark,
  },
}

export function usePalette(): Palette {
  const scheme = useColorScheme()
  return palettes[scheme === 'dark' ? 'dark' : 'light']
}
