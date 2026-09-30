import { describe, expect, it } from 'vitest'

import { bodyMetrics, codeMetrics } from './body-scale'

const BODY = [14, 15, 16, 17, 19, 21, 23]

describe('bodyMetrics', () => {
  it('follows the article ladder across Dynamic Type sizes', () => {
    expect(BODY.map((body) => bodyMetrics('article', body / 17).fontSize)).toEqual([
      13, 13, 14, 15, 17, 19, 20,
    ])
  })

  it('follows the note ladder across Dynamic Type sizes', () => {
    expect(BODY.map((body) => bodyMetrics('note', body / 17).fontSize)).toEqual([
      15, 15, 16, 17, 19, 21, 23,
    ])
  })

  it('keeps the default-size rhythm', () => {
    expect(bodyMetrics('article', 1)).toEqual({
      fontSize: 15,
      lineHeight: 26,
      paragraphGap: 20,
    })
    expect(bodyMetrics('note', 1)).toEqual({
      fontSize: 17,
      lineHeight: 28,
      paragraphGap: 16,
    })
  })

  it('scales line height with the article size', () => {
    expect(bodyMetrics('article', 23 / 17).lineHeight).toBe(35)
  })

  it('stops following at accessibility sizes', () => {
    expect(bodyMetrics('article', 3)).toEqual(bodyMetrics('article', 23 / 17))
  })
})

describe('codeMetrics', () => {
  it('uses 12.5/21 at the default size', () => {
    expect(codeMetrics(1)).toEqual({ fontSize: 12.5, lineHeight: 21 })
  })

  it('scales with Dynamic Type and floors at 11pt', () => {
    expect(codeMetrics(23 / 17)).toEqual({ fontSize: 17, lineHeight: 29 })
    expect(codeMetrics(14 / 17)).toEqual({ fontSize: 11, lineHeight: 18 })
  })
})
