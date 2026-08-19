/*
 * Pure numbers only — no react-native / reanimated imports. The splash reducer
 * imports this and must stay runnable under plain vitest.
 *
 * Tear sits at screen midline. The mark sits in the upper half; the owner
 * avatar mirrors it in the lower half, each `halfGap` from the seam.
 * `splash-icon*.png` are padded (228×888 @3x) so a centered native splash
 * lands the glyph at the same place on a ~852pt-tall phone.
 */
export const splashTiming = {
  markSize: 76,
  /** Distance from the tear line to the mark bottom / avatar top (mirror axis). */
  halfGap: 72,
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
    delay: 240,
    duration: 200,
    stackGap: 8,
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
