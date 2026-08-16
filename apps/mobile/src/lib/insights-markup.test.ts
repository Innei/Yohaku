import { describe, expect, it } from 'vitest'

import { stripInsightsMarkup } from './insights-markup'

describe('stripInsightsMarkup', () => {
  it('drops the insights-meta trailer and ref tags', () => {
    expect(
      stripInsightsMarkup(
        [
          '## TL;DR',
          '',
          '灰度是缓存问题<ref quote="先缓存" section="§分流"/>。',
          '',
          '<!-- insights-meta: {"genre":"tech"} -->',
        ].join('\n'),
      ),
    ).toBe('## TL;DR\n\n灰度是缓存问题。')
  })

  it('returns empty string for blank input', () => {
    expect(stripInsightsMarkup('')).toBe('')
    expect(stripInsightsMarkup('   ')).toBe('')
  })
})
