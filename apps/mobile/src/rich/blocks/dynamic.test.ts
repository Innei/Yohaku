import { describe, expect, it } from 'vitest'

import { catalogUrls, dynamicInput } from './dynamic'

describe('catalogUrls', () => {
  it('collects component urls and ignores malformed entries', () => {
    expect([
      ...catalogUrls({
        components: [{ url: 'https://a/x.js' }, { url: 3 }, null, {}],
      }),
    ]).toEqual(['https://a/x.js'])
    expect(catalogUrls(null).size).toBe(0)
    expect(catalogUrls({ components: 'nope' }).size).toBe(0)
  })

  it('accepts previousUrls and parentUrl so revised components keep rendering', () => {
    const urls = catalogUrls({
      components: [
        {
          url: 'https://a/v3.js',
          previousUrls: ['https://a/v1.js', 'https://a/v2.js', 7],
        },
        { url: 'https://a/fork.js', parentUrl: 'https://a/original.js' },
      ],
    })
    expect([...urls].sort()).toEqual(
      [
        'https://a/fork.js',
        'https://a/original.js',
        'https://a/v1.js',
        'https://a/v2.js',
        'https://a/v3.js',
      ].sort(),
    )
    expect(urls.has('https://a/unknown.js')).toBe(false)
  })
})

describe('dynamicInput', () => {
  it('reads url, props and initial height with the web defaults', () => {
    expect(
      dynamicInput({
        url: 'https://a/x.js',
        props: { n: 1 },
        initialHeight: 200,
      }),
    ).toEqual({ initialHeight: 200, props: { n: 1 }, url: 'https://a/x.js' })
    expect(dynamicInput({ url: 'https://a/x.js' })).toEqual({
      initialHeight: 320,
      props: {},
      url: 'https://a/x.js',
    })
  })
})
