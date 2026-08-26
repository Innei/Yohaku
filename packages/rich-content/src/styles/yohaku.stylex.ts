import * as stylex from '@stylexjs/stylex'

/**
 * Project theme tokens. These are NOT Tailwind defaults — do not replace
 * them with tailwind-stylex colors/fonts/fontSizes.
 *
 * Color values are CSS variables so [data-theme='dark'] overrides in
 * variables.css keep working without restating dark: utilities.
 */
export const yohaku = stylex.defineVars({
  accent: 'var(--color-accent)',
  paper: 'var(--color-paper, var(--surface-paper))',
  rootBg: 'var(--color-root-bg)',
  border: 'var(--color-border)',
  hair: 'var(--color-hair)',
  themedBgOpacity: 'var(--color-themed-bg_opacity, var(--bg-opacity))',

  neutral1: 'var(--color-neutral-1)',
  neutral2: 'var(--color-neutral-2)',
  neutral3: 'var(--color-neutral-3)',
  neutral4: 'var(--color-neutral-4)',
  neutral5: 'var(--color-neutral-5)',
  neutral6: 'var(--color-neutral-6)',
  neutral7: 'var(--color-neutral-7)',
  neutral8: 'var(--color-neutral-8)',
  neutral9: 'var(--color-neutral-9)',
  neutral10: 'var(--color-neutral-10)',

  muted1: 'var(--color-muted-1)',
  muted2: 'var(--color-muted-2)',
  muted3: 'var(--color-muted-3)',
  muted4: 'var(--color-muted-4)',
  muted5: 'var(--color-muted-5)',
  muted6: 'var(--color-muted-6)',
  muted7: 'var(--color-muted-7)',
  muted8: 'var(--color-muted-8)',
  muted9: 'var(--color-muted-9)',
  muted10: 'var(--color-muted-10)',

  info: 'var(--color-info)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  error: 'var(--color-error)',

  fontSans: 'var(--font-sans)',
  fontSerif: 'var(--font-serif)',
  fontMono: 'var(--font-mono)',
  fontLogoCjk: 'var(--font-logo-cjk)',
  fontLogoLatin: 'var(--font-logo-latin)',

  caption10: '10px',
  caption10Line: '1.4',
  label12: '12px',
  label12Line: '1.5',
  copy13: '13px',
  copy13Line: '1.54',
  copy14: '14px',
  copy14Line: '1.57',
  copy15: '15px',
  copy15Line: '1.6',
  copy16: '16px',
  copy16Line: '1.625',
  title20: '20px',
  title20Line: '1.4',
  title24: '24px',
  title24Line: '1.33',
  title28: '28px',
  title28Line: '1.29',
  display36: '36px',
  display36Line: '1.22',
  display48: '48px',
  display48Line: '1.17',
  iconSm: '14px',
  iconMd: '16px',
  iconLg: '18px',
})

/** Matches tokens.css @custom-variant dark exactly. */
export const DARK =
  ':where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *)'
