import { describe, expect, it } from 'vitest'

import {
  collapsingTitleScrollEdgeEffects,
  navigationScrollEdgeEffects,
  pageScrollEdgeEffects,
} from './scroll-edges'
import { getStackScreenOptions } from './stack-screen-options'

describe('scroll edge ownership', () => {
  it('pins soft on both navigation edges instead of iOS 27 automatic', () => {
    expect(navigationScrollEdgeEffects).toEqual({
      bottom: 'soft',
      top: 'soft',
    })
  })

  it('hides only the top edge for collapsing titles', () => {
    expect(collapsingTitleScrollEdgeEffects).toEqual({
      bottom: 'soft',
      top: 'hidden',
    })
  })

  it('uses the navigation preset on native stack screens', () => {
    expect(getStackScreenOptions('#fff').scrollEdgeEffects).toBe(
      navigationScrollEdgeEffects,
    )
  })

  it('selects collapsing edges when the title or cover owns the top', () => {
    expect(pageScrollEdgeEffects(true)).toBe(collapsingTitleScrollEdgeEffects)
    expect(pageScrollEdgeEffects(false)).toBe(navigationScrollEdgeEffects)
  })
})
