/*
 * Pure numbers only — no react-native / reanimated imports. The splash reducer
 * imports this and must stay runnable under plain vitest.
 */
export const splashTiming = {
  markSize: 76,
  tearOffset: 52,
  bleed: {
    delay: 100,
    duration: 360,
    fromScale: 1.075,
    fromOpacity: 0.3,
  },
  glyph: {
    fromScale: 1.014,
  },
  seal: {
    delay: 340,
    duration: 160,
    fromScale: 1.9,
    diameter: 5.9,
    left: 55.3,
    top: 55.1,
  },
  colophon: {
    delay: 340,
    duration: 200,
    avatar: 28,
    inset: 28,
    bottom: 52,
  },
  tear: {
    at: 564,
    duration: 376,
    bottomLag: 20,
  },
  markExit: {
    lag: 40,
    duration: 200,
  },
  breath: {
    after: 800,
    halfCycle: 1200,
    gap: 1.5,
  },
  edgeFade: 120,
  ceiling: 8000,
  reducedFade: 200,
} as const
