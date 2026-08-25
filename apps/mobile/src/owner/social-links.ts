import type { ImageSourcePropType } from 'react-native'

export interface SocialLink {
  href: string
  icon: ImageSourcePropType
  label: string
  schemePrefix?: string
  schemeUrl?: string
  type: string
}

export type SocialLinking = {
  canOpenURL: (url: string) => Promise<boolean>
  openURL: (url: string) => Promise<unknown>
}

type SocialScheme = { prefix: string; url: string }

// Brand marks are rasterized from the same mingcute set the web hero uses, so
// both surfaces show the same glyph; see assets/social.
const SOCIAL: Record<
  string,
  {
    href: (id: string) => string
    icon: ImageSourcePropType
    label: string
    scheme?: (id: string) => SocialScheme
  }
> = {
  github: {
    label: 'GitHub',
    icon: require('../../assets/social/github.png'),
    href: (id) => `https://github.com/${id}`,
    scheme: (id) => ({
      prefix: 'github://',
      url: `github://user?username=${handle(id)}`,
    }),
  },
  x: {
    label: 'X',
    icon: require('../../assets/social/x.png'),
    href: (id) => `https://x.com/${id}`,
    scheme: twitterScheme,
  },
  twitter: {
    label: 'Twitter',
    icon: require('../../assets/social/twitter.png'),
    href: (id) => `https://twitter.com/${id}`,
    scheme: twitterScheme,
  },
  bluesky: {
    label: 'Bluesky',
    icon: require('../../assets/social/bluesky.png'),
    href: (id) => `https://bsky.app/profile/${id}`,
    scheme: (id) => ({
      prefix: 'bluesky://',
      url: `bluesky://profile/${handle(id)}`,
    }),
  },
  telegram: {
    label: 'Telegram',
    icon: require('../../assets/social/telegram.png'),
    href: (id) => `https://t.me/${id}`,
    scheme: (id) => ({
      prefix: 'tg://',
      url: `tg://resolve?domain=${handle(id)}`,
    }),
  },
  discord: {
    label: 'Discord',
    icon: require('../../assets/social/discord.png'),
    href: (id) => `https://discord.gg/${id}`,
    scheme: (id) => ({
      prefix: 'discord://',
      url: `discord://-/invite/${id}`,
    }),
  },
  weibo: {
    label: '微博',
    icon: require('../../assets/social/weibo.png'),
    href: (id) => `https://weibo.com/${id}`,
    scheme: (id) => ({
      prefix: 'sinaweibo://',
      url: /^\d+$/.test(id)
        ? `sinaweibo://userinfo?uid=${id}`
        : `sinaweibo://userinfo?nick=${id}`,
    }),
  },
  bilibili: {
    label: '哔哩哔哩',
    icon: require('../../assets/social/bilibili.png'),
    href: (id) => `https://space.bilibili.com/${id}`,
    scheme: (id) => ({
      prefix: 'bilibili://',
      url: `bilibili://space/${id}`,
    }),
  },
  netease: {
    label: '网易云音乐',
    icon: require('../../assets/social/netease.png'),
    href: (id) => `https://music.163.com/#/user/home?id=${id}`,
    scheme: (id) => ({
      prefix: 'orpheus://',
      url: `orpheus://nm/user/home?id=${id}`,
    }),
  },
  steam: {
    label: 'Steam',
    icon: require('../../assets/social/steam.png'),
    href: (id) => `https://steamcommunity.com/id/${id}`,
    scheme: (id) => ({
      prefix: 'steam://',
      url: `steam://openurl/https://steamcommunity.com/id/${id}`,
    }),
  },
  qq: {
    label: 'QQ',
    icon: require('../../assets/social/qq.png'),
    href: (id) => `https://wpa.qq.com/msgrd?v=3&uin=${id}&site=qq&menu=yes`,
    scheme: (id) => ({
      prefix: 'mqqwpa://',
      url: `mqqwpa://im/chat?chat_type=wpa&uin=${id}&version=1&src_type=web`,
    }),
  },
  wechat: {
    label: '微信',
    icon: require('../../assets/social/wechat.png'),
    href: (id) => id,
  },
  mail: { label: 'Email', icon: require('../../assets/social/mail.png'), href: (id) => `mailto:${id}` },
  rss: { label: 'RSS', icon: require('../../assets/social/rss.png'), href: (id) => id },
}
const ALIASES: Record<string, string> = { email: 'mail', feed: 'rss' }

function handle(id: string): string {
  return id.replace(/^@/, '')
}

function twitterScheme(id: string): SocialScheme {
  return {
    prefix: 'twitter://',
    url: `twitter://user?screen_name=${handle(id)}`,
  }
}

export function socialLinks(
  ids: Record<string, string> | null | undefined,
): SocialLink[] {
  if (!ids) return []
  return Object.entries(ids).flatMap(([rawType, rawId]) => {
    const type = ALIASES[rawType] ?? rawType
    const entry = SOCIAL[type]
    const id = typeof rawId === 'string' ? rawId.trim() : ''
    if (!entry || !id) return []
    const href = entry.href(id)
    if (!/^(?:https?:|mailto:)/.test(href)) return []
    const scheme = entry.scheme?.(id)
    return [
      {
        type,
        href,
        icon: entry.icon,
        label: entry.label,
        ...(scheme
          ? { schemePrefix: scheme.prefix, schemeUrl: scheme.url }
          : {}),
      },
    ]
  })
}

export async function openSocialLink(
  link: SocialLink,
  linking: SocialLinking,
): Promise<void> {
  if (
    link.schemePrefix &&
    link.schemeUrl &&
    (await linking.canOpenURL(link.schemePrefix))
  ) {
    await linking.openURL(link.schemeUrl)
    return
  }
  await linking.openURL(link.href)
}
