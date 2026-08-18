import type { ThemeName } from '@yohaku/design-system/tokens'

type ShadowSet = Record<ThemeName, string>

export const shadow = {
  paper: {
    light: '0 1px 2px rgba(20,19,18,0.05), 0 6px 20px rgba(20,19,18,0.07)',
    dark: '0 1px 2px rgba(0,0,0,0.35), 0 6px 20px rgba(0,0,0,0.28)',
  },
  paperSmall: {
    light: '0 1px 2px rgba(20,19,18,0.05), 0 4px 12px rgba(20,19,18,0.08)',
    dark: '0 1px 2px rgba(0,0,0,0.35), 0 4px 12px rgba(0,0,0,0.3)',
  },
  ink: {
    light: '0 1px 2px rgba(20,19,18,0.2), 0 6px 16px rgba(20,19,18,0.18)',
    dark: '0 1px 2px rgba(0,0,0,0.4), 0 6px 16px rgba(0,0,0,0.3)',
  },
  capsule: {
    light: '0 1px 2px rgba(20,19,18,0.08), 0 10px 28px rgba(20,19,18,0.16)',
    dark: '0 1px 2px rgba(0,0,0,0.5), 0 10px 28px rgba(0,0,0,0.4)',
  },
  wellInset: {
    light: 'inset 0 1.5px 4px rgba(20,19,18,0.09)',
    dark: 'inset 0 1.5px 4px rgba(0,0,0,0.5)',
  },
} satisfies Record<string, ShadowSet>
