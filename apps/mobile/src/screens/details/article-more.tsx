import { Stack, useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useCallback, useMemo } from 'react'

import { PaperNavigationControl } from '@/components/navigation/paper-navigation-control'
import { usesPaperNavigationControls } from '@/components/navigation/platform'
import { useTranslations } from '@/i18n'
import { copyUrl } from '@/lib/copy-url'
import { shareUrl } from '@/lib/share'

export function ArticleMore({
  listenAvailable = false,
  listening = false,
  onListen,
  title,
  url,
}: {
  listenAvailable?: boolean
  listening?: boolean
  onListen?: () => void
  title?: string
  url: string
}) {
  const router = useRouter()
  const t = useTranslations('common')
  const tts = useTranslations('tts')
  const paperMenuItems = useMemo(
    () => [
      {
        hidden: !listenAvailable || listening || !onListen,
        icon: 'headphones',
        id: 'listen',
        title: tts('narrate'),
      },
      {
        icon: 'square.and.arrow.up',
        id: 'share',
        title: t('share'),
      },
      {
        icon: 'link',
        id: 'copy-link',
        title: t('copyLink'),
      },
      {
        icon: 'safari',
        id: 'open-in-browser',
        title: t('openInBrowser'),
      },
    ],
    [listenAvailable, listening, onListen, t, tts],
  )
  const handlePaperMenuAction = useCallback(
    (id: string) => {
      switch (id) {
        case 'listen': {
          onListen?.()
          break
        }
        case 'share': {
          void shareUrl(url, title)
          break
        }
        case 'copy-link': {
          void copyUrl(url)
          break
        }
        case 'open-in-browser': {
          void WebBrowser.openBrowserAsync(url)
          break
        }
      }
    },
    [onListen, title, url],
  )

  if (usesPaperNavigationControls) {
    return (
      <>
        {router.canGoBack() ? (
          <Stack.Toolbar asChild placement="left">
            <PaperNavigationControl
              accessibilityLabel={t('back')}
              icon="arrow.left"
              identifier="paper-navigation-back"
              onPress={() => router.back()}
            />
          </Stack.Toolbar>
        ) : null}
        <Stack.Toolbar asChild placement="right">
          <PaperNavigationControl
            accessibilityLabel={t('more')}
            icon="ellipsis"
            identifier="paper-navigation-more"
            menuItems={paperMenuItems}
            onMenuAction={handlePaperMenuAction}
          />
        </Stack.Toolbar>
      </>
    )
  }

  return (
    <Stack.Toolbar placement="right">
      <Stack.Toolbar.Menu accessibilityLabel={t('more')} icon="ellipsis">
        <Stack.Toolbar.MenuAction
          hidden={!listenAvailable || listening || !onListen}
          icon="headphones"
          onPress={onListen}
        >
          {tts('narrate')}
        </Stack.Toolbar.MenuAction>
        <Stack.Toolbar.MenuAction
          icon="square.and.arrow.up"
          onPress={() => void shareUrl(url, title)}
        >
          {t('share')}
        </Stack.Toolbar.MenuAction>
        <Stack.Toolbar.MenuAction icon="link" onPress={() => void copyUrl(url)}>
          {t('copyLink')}
        </Stack.Toolbar.MenuAction>
        <Stack.Toolbar.MenuAction
          icon="safari"
          onPress={() => void WebBrowser.openBrowserAsync(url)}
        >
          {t('openInBrowser')}
        </Stack.Toolbar.MenuAction>
      </Stack.Toolbar.Menu>
    </Stack.Toolbar>
  )
}
