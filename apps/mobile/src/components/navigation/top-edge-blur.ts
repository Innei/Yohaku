export const collapsingTitleScrollEdgeEffects = {
  bottom: 'automatic',
  top: 'hidden',
} as const

/** Telegram's top EdgeEffect container extends 44pt beyond the nav bounds. */
const TOP_BLUR_EDGE_EFFECT_EXTENSION = 44

export function topBlurOverlayHeight(headerHeight: number) {
  return Math.max(0, headerHeight) + TOP_BLUR_EDGE_EFFECT_EXTENSION
}
