import { Stack, useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useCallback, useMemo } from 'react'

import { PaperNavigationControl } from '@/components/navigation/paper-navigation-control'
import { usesPaperNavigationControls } from '@/components/navigation/platform'
import { useTranslations } from '@/i18n'
import { copyUrl } from '@/lib/copy-url'
import { shareUrl } from '@/lib/share'

import { groupMenuItemsByCategory } from './article-more-menu'

export function ArticleMore({
  listenAvailable = false,
  listening = false,
  onListen,
  onPrompt,
  onToc,
  promptLabel,
  tocAvailable = false,
  title,
  url,
}: {
  listenAvailable?: boolean
  listening?: boolean
  onListen?: () => void
  onPrompt?: () => void
  onToc?: () => void
  promptLabel?: string
  tocAvailable?: boolean
  title?: string
  url: string
}) {
  const router = useRouter()
  const t = useTranslations('common')
  const tts = useTranslations('tts')
  const paperMenuItems = useMemo(
    () => [
      {
        category: 'article',
        hidden: !listenAvailable || listening || !onListen,
        icon: 'headphones' as const,
        id: 'listen',
        title: tts('narrate'),
      },
      {
        category: 'article',
        hidden: !onPrompt || !promptLabel,
        icon: 'wand.and.stars' as const,
        id: 'prompt',
        title: promptLabel ?? '',
      },
      {
        category: 'article',
        hidden: !tocAvailable || !onToc,
        icon: 'list.bullet' as const,
        id: 'toc',
        title: t('toc'),
      },
      {
        category: 'share',
        icon: 'square.and.arrow.up' as const,
        id: 'share',
        title: t('share'),
      },
      {
        category: 'share',
        icon: 'link' as const,
        id: 'copy-link',
        title: t('copyLink'),
      },
      {
        category: 'share',
        icon: 'safari' as const,
        id: 'open-in-browser',
        title: t('openInBrowser'),
      },
    ],
    [
      listenAvailable,
      listening,
      onListen,
      onPrompt,
      onToc,
      promptLabel,
      t,
      tocAvailable,
      tts,
    ],
  )
  const menuGroups = useMemo(
    () => groupMenuItemsByCategory(paperMenuItems),
    [paperMenuItems],
  )
  const handlePaperMenuAction = useCallback(
    (id: string) => {
      switch (id) {
        case 'listen': {
          onListen?.()
          break
        }
        case 'prompt': {
          onPrompt?.()
          break
        }
        case 'toc': {
          onToc?.()
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
    [onListen, onPrompt, onToc, title, url],
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
        {menuGroups.map((group) => (
          <Stack.Toolbar.Menu
            key={group[0]?.category ?? group[0]?.id}
            inline
          >
            {group.map((item) => (
              <Stack.Toolbar.MenuAction
                key={item.id}
                icon={item.icon}
                onPress={() => handlePaperMenuAction(item.id)}
              >
                {item.title}
              </Stack.Toolbar.MenuAction>
            ))}
          </Stack.Toolbar.Menu>
        ))}
      </Stack.Toolbar.Menu>
    </Stack.Toolbar>
  )
}
