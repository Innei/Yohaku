import { Link, useRouter } from 'expo-router'
import {
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  useCallback,
  useMemo,
} from 'react'
import type { GestureResponderEvent } from 'react-native'

import { NativePressable } from '@/components/ui'
import type { NoteRow } from '@/db/schema'
import { useTranslations } from '@/i18n'
import { copyUrl } from '@/lib/copy-url'
import { openNote } from '@/lib/open-article'
import { openExternalUrl } from '@/lib/open-external'
import { shareUrl } from '@/lib/share'
import { siteHref } from '@/lib/site-url'

type LinkPressEvent =
  GestureResponderEvent | ReactMouseEvent<HTMLAnchorElement, MouseEvent>

export function NoteContextLink({
  children,
  note,
}: {
  children: ReactNode
  note: NoteRow
}) {
  const router = useRouter()
  const t = useTranslations('common')
  const webUrl = siteHref(`/notes/${note.nid}`)
  const href = useMemo(
    () =>
      ({
        pathname: '/notes/[nid]' as const,
        params: { nid: String(note.nid) },
      }) as const,
    [note.nid],
  )

  const handleOpen = useCallback(() => {
    openNote(router, note)
  }, [note, router])

  const handleLinkPress = useCallback(
    (event: LinkPressEvent) => {
      event.preventDefault()
      handleOpen()
    },
    [handleOpen],
  )

  return (
    <Link asChild href={href} onPress={handleLinkPress}>
      <Link.Trigger>
        <NativePressable
          accessibilityRole="link"
          onAccessibilityTap={handleOpen}
        >
          {children}
        </NativePressable>
      </Link.Trigger>
      <Link.Preview />
      <Link.Menu>
        <Link.MenuAction
          icon="square.and.arrow.up"
          onPress={() => void shareUrl(webUrl, note.title)}
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
    </Link>
  )
}
