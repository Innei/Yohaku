import { describe, expect, it, vi } from 'vitest'

import { openSocialLink, socialLinks, type SocialLinking } from './social-links'

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

  it('maps each platform to a native scheme', () => {
    const links = Object.fromEntries(
      socialLinks({
        github: '@Innei',
        x: '@innei',
        twitter: 'innei',
        bluesky: 'innei.bsky.social',
        telegram: '@innei',
        discord: 'abcd',
        weibo: '123456',
        bilibili: '1',
        netease: '2',
        steam: 'innei',
        qq: '10000',
      }).map((link) => [link.type, link]),
    )

    expect(links.github).toMatchObject({
      schemePrefix: 'github://',
      schemeUrl: 'github://user?username=Innei',
    })
    expect(links.x).toMatchObject({
      schemePrefix: 'twitter://',
      schemeUrl: 'twitter://user?screen_name=innei',
    })
    expect(links.twitter).toMatchObject({
      schemePrefix: 'twitter://',
      schemeUrl: 'twitter://user?screen_name=innei',
    })
    expect(links.bluesky).toMatchObject({
      schemePrefix: 'bluesky://',
      schemeUrl: 'bluesky://profile/innei.bsky.social',
    })
    expect(links.telegram).toMatchObject({
      schemePrefix: 'tg://',
      schemeUrl: 'tg://resolve?domain=innei',
    })
    expect(links.discord).toMatchObject({
      schemePrefix: 'discord://',
      schemeUrl: 'discord://-/invite/abcd',
    })
    expect(links.weibo).toMatchObject({
      schemePrefix: 'sinaweibo://',
      schemeUrl: 'sinaweibo://userinfo?uid=123456',
    })
    expect(links.bilibili).toMatchObject({
      schemePrefix: 'bilibili://',
      schemeUrl: 'bilibili://space/1',
    })
    expect(links.netease).toMatchObject({
      schemePrefix: 'orpheus://',
      schemeUrl: 'orpheus://nm/user/home?id=2',
    })
    expect(links.steam).toMatchObject({
      schemePrefix: 'steam://',
      schemeUrl: 'steam://openurl/https://steamcommunity.com/id/innei',
    })
    expect(links.qq).toMatchObject({
      schemePrefix: 'mqqwpa://',
      schemeUrl: 'mqqwpa://im/chat?chat_type=wpa&uin=10000&version=1&src_type=web',
    })
  })

  it('uses a weibo nick scheme when the id is not numeric', () => {
    expect(socialLinks({ weibo: 'innei' })[0]).toMatchObject({
      schemeUrl: 'sinaweibo://userinfo?nick=innei',
    })
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

describe('openSocialLink', () => {
  const github = socialLinks({ github: 'Innei' })[0]

  it('opens the native scheme when the app is installed', async () => {
    const linking = fakeLinking({ 'github://': true })
    await openSocialLink(github, linking)
    expect(linking.openURL).toHaveBeenCalledWith('github://user?username=Innei')
  })

  it('falls back to the web href when the app is not installed', async () => {
    const linking = fakeLinking({ 'github://': false })
    await openSocialLink(github, linking)
    expect(linking.openURL).toHaveBeenCalledWith('https://github.com/Innei')
  })

  it('opens mailto and rss hrefs directly', async () => {
    const linking = fakeLinking({})
    const [mail, rss] = socialLinks({
      email: 'i@innei.in',
      feed: 'https://innei.in/feed',
    })
    await openSocialLink(mail, linking)
    await openSocialLink(rss, linking)
    expect(linking.openURL).toHaveBeenCalledWith('mailto:i@innei.in')
    expect(linking.openURL).toHaveBeenCalledWith('https://innei.in/feed')
  })
})

function fakeLinking(canOpen: Record<string, boolean>): SocialLinking & {
  openURL: ReturnType<typeof vi.fn>
} {
  return {
    canOpenURL: async (url: string) => canOpen[url] ?? false,
    openURL: vi.fn(async () => true),
  }
}
