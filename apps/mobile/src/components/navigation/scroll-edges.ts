export const navigationScrollEdgeEffects = {
  bottom: 'soft',
  top: 'soft',
} as const

export const collapsingTitleScrollEdgeEffects = {
  bottom: 'soft',
  top: 'hidden',
} as const

export function pageScrollEdgeEffects(hideTop: boolean) {
  return hideTop
    ? collapsingTitleScrollEdgeEffects
    : navigationScrollEdgeEffects
}
