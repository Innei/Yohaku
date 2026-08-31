/** Extra Small / default Large body (17pt). */
export const FONT_SCALE_MIN = 14 / 17
/** XXXL / default Large body. Accessibility AX* is not followed. */
export const FONT_SCALE_MAX = 23 / 17

export function clampFontScale(fontScale: number) {
  return Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, fontScale))
}
