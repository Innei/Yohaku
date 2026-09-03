import { Stack, useRouter } from 'expo-router'
import { useCallback, useMemo } from 'react'

import { PaperNavigationControl } from '@/components/navigation/paper-navigation-control'
import { usesPaperNavigationControls } from '@/components/navigation/platform'
import { useTranslations } from '@/i18n'
import { copyUrl } from '@/lib/copy-url'
import { openExternalUrl } from '@/lib/open-external'
import { shareUrl } from '@/lib/share'

import {
  buildArticleMoreItems,
  groupMenuItemsByCategory,
} from './article-more-menu'

export function ArticleMore({
  listenAvailable = false,
  listening = false,
  onListen,
  onPrint,
  onPrompt,
  onToc,
  printAvailable = false,
  promptLabel,
  tocAvailable = false,
  title,
  url,
}: {
  listenAvailable?: boolean
  listening?: boolean
  onListen?: () => void
  onPrint?: () => void
  onPrompt?: () => void
  onToc?: () => void
  printAvailable?: boolean
  promptLabel?: string
  tocAvailable?: boolean
  title?: string
  url: string
}) {
  const router = useRouter()
  const t = useTranslations('common')
  const tts = useTranslations('tts')
  const paperMenuItems = useMemo(
    () =>
      buildArticleMoreItems({
        copyLink: t('copyLink'),
        listenAvailable: listenAvailable && Boolean(onListen) && !listening,
        listening: false,
        narrate: tts('narrate'),
        openInBrowser: t('openInBrowser'),
        print: t('print'),
        printAvailable: printAvailable && Boolean(onPrint),
        promptLabel: onPrompt ? promptLabel : undefined,
        share: t('share'),
        toc: t('toc'),
        tocAvailable: tocAvailable && Boolean(onToc),
      }),
    [
      listenAvailable,
      listening,
      onListen,
      onPrint,
      onPrompt,
      onToc,
      printAvailable,
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
        case 'print': {
          onPrint?.()
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
          void openExternalUrl(url)
          break
        }
      }
    },
    [onListen, onPrint, onPrompt, onToc, title, url],
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
            inline
            key={group[0]?.category ?? group[0]?.id}
          >
            {group.map((item) => (
              <Stack.Toolbar.MenuAction
                icon={item.icon}
                key={item.id}
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
