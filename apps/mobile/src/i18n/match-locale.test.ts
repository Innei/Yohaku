import { describe, expect, it } from 'vitest'

import { matchLocale } from './match-locale'

describe('matchLocale', () => {
  it('takes an exact tag', () => {
    expect(matchLocale([{ languageTag: 'zh-TW', languageCode: 'zh' }])).toBe(
      'zh-TW',
    )
    expect(matchLocale([{ languageTag: 'ja-JP', languageCode: 'ja' }])).toBe(
      'ja',
    )
  })

  it('routes traditional Chinese by script or region', () => {
    expect(
      matchLocale([
        {
          languageTag: 'zh-Hant-TW',
          languageCode: 'zh',
          languageScriptCode: 'Hant',
        },
      ]),
    ).toBe('zh-TW')
    expect(
      matchLocale([
        { languageTag: 'zh-HK', languageCode: 'zh', regionCode: 'HK' },
      ]),
    ).toBe('zh-TW')
  })

  it('routes simplified Chinese to zh', () => {
    expect(
      matchLocale([
        {
          languageTag: 'zh-Hans-CN',
          languageCode: 'zh',
          languageScriptCode: 'Hans',
          regionCode: 'CN',
        },
      ]),
    ).toBe('zh')
  })

  it('falls through unsupported languages to the next candidate', () => {
    expect(
      matchLocale([
        { languageTag: 'fr-FR', languageCode: 'fr' },
        { languageTag: 'ko-KR', languageCode: 'ko' },
      ]),
    ).toBe('ko')
  })

  it('defaults to zh when nothing matches', () => {
    expect(matchLocale([{ languageTag: 'fr-FR', languageCode: 'fr' }])).toBe(
      'zh',
    )
    expect(matchLocale([])).toBe('zh')
    expect(matchLocale([{}])).toBe('zh')
  })
})
