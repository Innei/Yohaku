import { getInjectBodySizeObserverScript } from 'expo/src/dom/injection'
import { requireNativeModule } from 'expo-modules-core'
import * as Updates from 'expo-updates'
import { Appearance } from 'react-native'

import { apiBaseUrl } from '@/api/base-url'
import { getLocale, translate } from '@/i18n'
import { getSiteUrl } from '@/lib/site-url'
import { webviewSerifFontFamily } from '@/theme/font-faces'

import { buildMediaRewriteScript } from '../../../../../packages/dom-webview/src/site-referer'
import type { RichBodyLabels } from './rich-body'

// Boots the webview pool natively at launch, replacing the old hidden-mount
// warmer: this fabricates the inputs a real mount would have produced — the
// same props the warmer passed, in expo's marshalled `initialProps` shape —
// and native resolves which exported DOM component is the article body.
// Dev is excluded: the Metro-served DOM URL cannot be discovered without a
// mount, so a dev session's first article open stays cold and seeds the pool.

const DomWebViewModule = requireNativeModule<{
  warmPool: (
    candidates: string[],
    injectedObjectJson: string,
    injectedJavaScript: string,
    injectedJavaScriptBeforeContentLoaded: string,
  ) => Promise<void>
}>('ExpoDomWebViewModule')

function warmLabels(): RichBodyLabels {
  const locale = getLocale()
  return {
    nestedDocCollapse: translate(locale, 'detail', 'nestedDocCollapse'),
    nestedDocExpand: translate(locale, 'detail', 'nestedDocExpand'),
    nestedDocLabel: translate(locale, 'detail', 'nestedDoc'),
    openInBrowser: translate(locale, 'common', 'openInBrowser'),
    unrenderable: translate(locale, 'detail', 'unrenderable'),
  }
}

// The current update's assets only — scanning `.expo-internal` directly could
// pick a stale html left behind by a previous update generation.
function updateHtmlCandidates(): string[] {
  if (!Updates.isEnabled || Updates.isEmbeddedLaunch) return []
  return Object.values(Updates.localAssets).filter((asset) =>
    asset.endsWith('.html'),
  )
}

export function warmWebviewPool() {
  if (__DEV__) return
  const injectedObjectJson = JSON.stringify({
    EXPO_DOM_HOST_OS: 'ios',
    initialProps: {
      names: [
        'onImagePress',
        'onLinkPress',
        'onNestedDocExpand',
        'onScrollToAnchor',
      ],
      props: {
        apiBase: apiBaseUrl(),
        content: '',
        labels: warmLabels(),
        locale: getLocale(),
        serifFontFamily: webviewSerifFontFamily(getLocale(), false),
        theme: Appearance.getColorScheme() === 'dark' ? 'dark' : 'light',
        variant: 'article',
        webUrl: '',
      },
    },
  })
  void DomWebViewModule.warmPool(
    updateHtmlCandidates(),
    injectedObjectJson,
    getInjectBodySizeObserverScript(),
    buildMediaRewriteScript(getSiteUrl()),
  )
}
