import { describe, expect, it } from 'vitest'

import { socialLinks } from './social-links'

describe('socialLinks', () => {
  it('builds hrefs and resolves aliases', () => {
    expect(
      socialLinks({
        github: 'Innei',
        email: 'i@innei.in',
        feed: 'https://innei.in/feed',
      }),
    ).toMatchObject([
      { type: 'github', href: 'https://github.com/Innei', label: 'GitHub' },
      { type: 'mail', href: 'mailto:i@innei.in', label: 'Email' },
      { type: 'rss', href: 'https://innei.in/feed', label: 'RSS' },
    ])
  })

  it('gives every platform an icon asset', () => {
    for (const link of socialLinks({ github: 'a', x: 'b', bilibili: '1' })) {
      expect(link.icon).toBeTruthy()
    }
  })

  it('drops unknown platforms, blank ids, and non-web hrefs', () => {
    expect(
      socialLinks({
        myspace: 'someone',
        github: '   ',
        rss: 'javascript:alert(1)',
      }),
    ).toEqual([])
    expect(socialLinks(null)).toEqual([])
  })
})
