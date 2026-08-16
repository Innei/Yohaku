import { createThemeStyle } from '@haklex/rich-compose/style-token/styles'
import type { RichEditorVariant } from '@haklex/rich-editor'
import type { CSSProperties } from 'react'

export const fallbackSansFont =
  "var(--app-font-sans), var(--app-font-sans-cjk, system-ui, -apple-system, 'PingFang SC', 'Microsoft YaHei', 'Segoe UI', Roboto, Helvetica, 'noto sans sc', 'hiragino sans gb', sans-serif, Apple Color Emoji, Segoe UI Emoji, Not Color Emoji)"
export const fallbackSerifFont =
  "var(--app-font-serif, 'Noto Serif CJK SC', 'Noto Serif SC', 'Source Han Serif SC', 'Source Han Serif', source-han-serif-sc, SongTi SC, SimSun, 'Hiragino Mincho ProN', 'Yu Mincho', Georgia, serif)"
export const fallbackMonoFont =
  "var(--app-font-mono, 'OperatorMonoSSmLig Nerd Font'), 'Cascadia Code PL', 'FantasqueSansMono Nerd Font', 'operator mono', JetBrainsMono, 'Fira code Retina', 'Fira code', Consolas, Monaco, 'Hannotate SC', monospace, -apple-system"

export const baseFontVarStyle = {
  '--font-sans': fallbackSansFont,
  '--font-serif': fallbackSerifFont,
  '--font-mono': fallbackMonoFont,
} as CSSProperties

export function createYohakuThemeStyle(
  variant?: RichEditorVariant,
): CSSProperties {
  return createThemeStyle({
    color: {
      accent: 'var(--color-accent, #c56473)',
      link: 'var(--color-accent, #c56473)',
      accentLight:
        'color-mix(in srgb, var(--color-accent, #c56473) 20%, transparent)',
      quoteBorder: 'var(--color-accent, #c56473)',
    },
    layout: { maxWidth: '100%' },
    typography: {
      fontFamily:
        variant === 'note'
          ? `var(--note-font-override, ${fallbackSerifFont})`
          : fallbackSansFont,
      fontFamilySerif: fallbackSerifFont,
      fontMono: fallbackMonoFont,
    },
  })
}
