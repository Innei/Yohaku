/*
 * Native token bridge — the same static contract as tokens.css, as data.
 * Light values MUST mirror tokens.css (verified by scripts/check.ts).
 * Dark values mirror apps/web/src/styles/variables.css [data-theme='dark'];
 * that file is the source of truth — update both together.
 */

export const neutral = {
  light: {
    1: '#f9f8f5',
    2: '#f0efeb',
    3: '#e3e1db',
    4: '#d0cec6',
    5: '#a8a69f',
    6: '#787670',
    7: '#5c5a55',
    8: '#403f3a',
    9: '#24231f',
    10: '#141312',
  },
  dark: {
    1: '#141414',
    2: '#242424',
    3: '#404040',
    4: '#5c5c5c',
    5: '#787878',
    6: '#a8a8a8',
    7: '#d0d0d0',
    8: '#e3e3e3',
    9: '#f0f0f0',
    10: '#f8f8f8',
  },
} as const

export const accent = {
  light: '#c56473',
  dark: '#e095a4',
} as const

export const semantic = {
  light: {
    info: '#3d6896',
    success: '#5e9f7e',
    warning: '#a87a3d',
    error: '#a64953',
  },
  dark: {
    info: '#7090b3',
    success: '#8cbea3',
    warning: '#c8a06b',
    error: '#c8767f',
  },
} as const

/*
 * Paper-on-desk surfaces (native-only vocabulary, no css counterpart):
 * desk = screen ground, paper = raised content card, well = sunken input.
 * Content floats, input sinks.
 */
export const surface = {
  light: {
    desk: '#f0efeb',
    deskDeep: '#eceae4',
    paper: '#fdfcf9',
    well: '#e7e5de',
  },
  dark: {
    desk: '#141414',
    deskDeep: '#101010',
    paper: '#242424',
    well: '#0d0d0d',
  },
} as const

export const type = {
  caption10: { size: 10, lineHeight: 14 },
  label12: { size: 12, lineHeight: 18 },
  copy13: { size: 13, lineHeight: 20 },
  copy14: { size: 14, lineHeight: 22 },
  copy15: { size: 15, lineHeight: 24 },
  copy16: { size: 16, lineHeight: 26 },
  title20: { size: 20, lineHeight: 28 },
  title24: { size: 24, lineHeight: 32 },
  title28: { size: 28, lineHeight: 36 },
  display36: { size: 36, lineHeight: 44 },
  display48: { size: 48, lineHeight: 56 },
} as const

export const radius = {
  paper: 18,
  control: 14,
  field: 12,
  pill: 999,
} as const

export const elevation = {
  paper: {
    shadowColor: '#141312',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffsetY: 4,
  },
  paperPressed: {
    shadowColor: '#141312',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffsetY: 1,
  },
  capsule: {
    shadowColor: '#141312',
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffsetY: 8,
  },
} as const

/*
 * Motion charter: press = physical sink (never opacity flicker); sliding
 * elements respond < 320ms with at most one gentle overshoot; fades are for
 * content loading only.
 */
export const motion = {
  pressScale: 0.96,
  pressTranslateY: 1,
  responseMs: 320,
} as const

export type ThemeName = 'light' | 'dark'
export type NeutralStep = keyof typeof neutral.light
export type TypeRole = keyof typeof type
