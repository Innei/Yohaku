export type ArticleMoreIcon =
  | 'headphones'
  | 'wand.and.stars'
  | 'list.bullet'
  | 'printer'
  | 'square.and.arrow.up'
  | 'link'
  | 'safari'

export type ArticleMoreItem = {
  category: string
  hidden?: boolean
  icon: ArticleMoreIcon
  id: string
  title: string
}

export function buildArticleMoreItems(input: {
  copyLink: string
  listenAvailable: boolean
  listening: boolean
  openInBrowser: string
  print: string
  printAvailable: boolean
  promptLabel?: string
  share: string
  toc: string
  tocAvailable: boolean
  narrate: string
}): ArticleMoreItem[] {
  return [
    {
      category: 'article',
      hidden: !input.listenAvailable || input.listening,
      icon: 'headphones',
      id: 'listen',
      title: input.narrate,
    },
    {
      category: 'article',
      hidden: !input.promptLabel,
      icon: 'wand.and.stars',
      id: 'prompt',
      title: input.promptLabel ?? '',
    },
    {
      category: 'article',
      hidden: !input.tocAvailable,
      icon: 'list.bullet',
      id: 'toc',
      title: input.toc,
    },
    {
      category: 'share',
      hidden: !input.printAvailable,
      icon: 'printer',
      id: 'print',
      title: input.print,
    },
    {
      category: 'share',
      icon: 'square.and.arrow.up',
      id: 'share',
      title: input.share,
    },
    {
      category: 'share',
      icon: 'link',
      id: 'copy-link',
      title: input.copyLink,
    },
    {
      category: 'share',
      icon: 'safari',
      id: 'open-in-browser',
      title: input.openInBrowser,
    },
  ]
}

export function groupMenuItemsByCategory<
  T extends { category?: string; hidden?: boolean },
>(items: T[]): T[][] {
  const groups: T[][] = []
  for (const item of items) {
    if (item.hidden) continue
    const last = groups.at(-1)
    if (last && last[0]?.category === item.category) last.push(item)
    else groups.push([item])
  }
  return groups
}
