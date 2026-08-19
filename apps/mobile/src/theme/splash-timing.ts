/*
 * Pure numbers only — no react-native / reanimated imports. The splash reducer
 * imports this and must stay runnable under plain vitest.
 *
 * Tear sits at screen midline. The mark is kept at the native LaunchScreen
 * centre while the owner colophon sits below the seam. The square splash
 * assets and this `markSize` must match app.config.ts so the native-to-React
 * handoff has identical geometry.
 */
export const splashTiming = {
  markSize: 120,
  /** Distance from the tear line to the owner colophon. */
  halfGap: 72,
  nativeFade: {
    duration: 140,
    handoffDelay: 180,
  },
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
    duration: 200,
    fromScale: 1.9,
    diameter: 9.4,
    left: 85.4,
    top: 85.1,
  },
  colophon: {
    delay: 440,
    duration: 300,
    fromTranslateY: 10,
    avatarSize: 60,
    stackGap: 8,
  },
  tear: {
    at: 1240,
    duration: 400,
    bottomLag: 20,
  },
  markExit: {
    lag: 40,
    duration: 200,
  },
  breath: {
    after: 1500,
    halfCycle: 1200,
    gap: 1.5,
  },
  edgeFade: 120,
  ceiling: 8000,
  reducedMinimum: 500,
  reducedFade: 200,
} as const
