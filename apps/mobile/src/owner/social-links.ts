import type { ImageSourcePropType } from 'react-native'

export interface SocialLink {
  href: string
  icon: ImageSourcePropType
  label: string
  type: string
}

// Brand marks are rasterized from the same mingcute set the web hero uses, so
// both surfaces show the same glyph; see assets/social.
const SOCIAL: Record<
  string,
  { label: string; icon: ImageSourcePropType; href: (id: string) => string }
> = {
  github: {
    label: 'GitHub',
    icon: require('../../assets/social/github.png'),
    href: (id) => `https://github.com/${id}`,
  },
  x: { label: 'X', icon: require('../../assets/social/x.png'), href: (id) => `https://x.com/${id}` },
  twitter: {
    label: 'Twitter',
    icon: require('../../assets/social/twitter.png'),
    href: (id) => `https://twitter.com/${id}`,
  },
  bluesky: {
    label: 'Bluesky',
    icon: require('../../assets/social/bluesky.png'),
    href: (id) => `https://bsky.app/profile/${id}`,
  },
  telegram: {
    label: 'Telegram',
    icon: require('../../assets/social/telegram.png'),
    href: (id) => `https://t.me/${id}`,
  },
  discord: {
    label: 'Discord',
    icon: require('../../assets/social/discord.png'),
    href: (id) => `https://discord.gg/${id}`,
  },
  weibo: {
    label: '微博',
    icon: require('../../assets/social/weibo.png'),
    href: (id) => `https://weibo.com/${id}`,
  },
  bilibili: {
    label: '哔哩哔哩',
    icon: require('../../assets/social/bilibili.png'),
    href: (id) => `https://space.bilibili.com/${id}`,
  },
  netease: {
    label: '网易云音乐',
    icon: require('../../assets/social/netease.png'),
    href: (id) => `https://music.163.com/#/user/home?id=${id}`,
  },
  steam: {
    label: 'Steam',
    icon: require('../../assets/social/steam.png'),
    href: (id) => `https://steamcommunity.com/id/${id}`,
  },
  qq: {
    label: 'QQ',
    icon: require('../../assets/social/qq.png'),
    href: (id) => `https://wpa.qq.com/msgrd?v=3&uin=${id}&site=qq&menu=yes`,
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
    return [{ type, href, icon: entry.icon, label: entry.label }]
  })
}
