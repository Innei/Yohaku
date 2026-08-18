import { type Href, Link } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import {
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  useCallback,
} from 'react'
import type { GestureResponderEvent } from 'react-native'

import { primeArticleBody } from '@/components/dom/prime-body'
import { useTranslations } from '@/i18n'
import { copyUrl } from '@/lib/copy-url'
import { shareUrl } from '@/lib/share'

import type { ActivityHref } from './activity-href'
import type { LikedListItem } from './liked-list-model'
import type { ReadingListItem } from './reading-list-model'

type LinkPressEvent =
  GestureResponderEvent | ReactMouseEvent<HTMLAnchorElement, MouseEvent>

export function openActivityHref(
  target: ActivityHref,
  router: { push: (href: Href) => void },
  prime?: () => void,
) {
  if (target.browser && target.webUrl) {
    void WebBrowser.openBrowserAsync(target.webUrl)
    return
  }
  prime?.()
  router.push(target.href)
}

export function primeActivityBody(
  item: LikedListItem | ReadingListItem,
  webUrl: string,
) {
  if (item.kind === 'post') {
    if (item.post.contentFormat === 'lexical' && item.post.content) {
      primeArticleBody({
        content: item.post.content,
        enrichments: item.post.enrichments ?? undefined,
        key: item.post.id,
        variant: 'article',
        webUrl,
      })
    }
    return
  }
  if (item.kind !== 'note') return
  if (item.note.contentFormat === 'lexical' && item.note.content) {
    primeArticleBody({
      content: item.note.content,
      enrichments: item.note.enrichments ?? undefined,
      key: item.note.id,
      variant: 'note',
      webUrl,
    })
  }
}

export function ActivityLink({
  children,
  target,
  onOpen,
}: {
  children: ReactNode
  target: ActivityHref
  onOpen: () => void
}) {
  const t = useTranslations('common')
  const handlePress = useCallback(
    (event: LinkPressEvent) => {
      event.preventDefault()
      onOpen()
    },
    [onOpen],
  )
  const webUrl = target.webUrl

  return (
    <Link asChild href={target.href} onPress={handlePress}>
      <Link.Trigger>{children}</Link.Trigger>
      <Link.Preview />
      {webUrl ? (
        <Link.Menu>
          <Link.MenuAction
            icon="square.and.arrow.up"
            onPress={() => void shareUrl(webUrl, target.title)}
          >
            {t('share')}
          </Link.MenuAction>
          <Link.MenuAction icon="link" onPress={() => void copyUrl(webUrl)}>
            {t('copyLink')}
          </Link.MenuAction>
          <Link.MenuAction
            icon="safari"
            onPress={() => void WebBrowser.openBrowserAsync(webUrl)}
          >
            {t('openInBrowser')}
          </Link.MenuAction>
        </Link.Menu>
      ) : null}
    </Link>
  )
}
