import { type Href, Link } from 'expo-router'
import {
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  useCallback,
} from 'react'
import type { GestureResponderEvent } from 'react-native'

import { useTranslations } from '@/i18n'
import { copyUrl } from '@/lib/copy-url'
import { openExternalUrl } from '@/lib/open-external'
import { shareUrl } from '@/lib/share'

import type { ActivityHref } from './activity-href'

type LinkPressEvent =
  GestureResponderEvent | ReactMouseEvent<HTMLAnchorElement, MouseEvent>

export function openActivityHref(
  target: ActivityHref,
  router: { push: (href: Href) => void },
) {
  if (target.browser && target.webUrl) {
    void openExternalUrl(target.webUrl)
    return
  }
  router.push(target.href)
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
            onPress={() => void openExternalUrl(webUrl)}
          >
            {t('openInBrowser')}
          </Link.MenuAction>
        </Link.Menu>
      ) : null}
    </Link>
  )
}
