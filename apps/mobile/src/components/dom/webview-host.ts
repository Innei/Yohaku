import {
  type HostCapabilities,
  HostFetchError,
  imagePreviewSourceFromElement,
  type OpenImagePayload,
} from '@yohaku/rich-content/host'

import { MobileCodeBlock } from './code-block'

const IMAGE_PREVIEW_MESSAGE = 'yohaku:image-preview'
const IMAGE_PREWARM_MESSAGE = 'yohaku:image-preview-prewarm'

function postNativeMessage(message: object): boolean {
  if (typeof window === 'undefined') return false
  const bridge = (
    window as unknown as {
      ReactNativeWebView?: { postMessage: (data: string) => void }
    }
  ).ReactNativeWebView
  if (!bridge) return false
  try {
    bridge.postMessage(JSON.stringify(message))
    return true
  } catch {
    return false
  }
}

export function postNativeImagePreview(
  payload: OpenImagePayload,
  siteReferer?: string,
): boolean {
  if (!payload.source) return false
  return postNativeMessage({
    ...payload,
    siteReferer,
    type: IMAGE_PREVIEW_MESSAGE,
  })
}

export function prewarmNativeImagePreview(element: HTMLImageElement): boolean {
  return postNativeMessage({
    source: imagePreviewSourceFromElement(element),
    type: IMAGE_PREWARM_MESSAGE,
  })
}

export interface WebviewHostDeps {
  apiBase: string
  enrichments?: HostCapabilities['enrichments']
  labels: HostCapabilities['labels']
  locale?: string
  nestedDocPresentation?: HostCapabilities['nestedDocPresentation']
  onImagePress: (payload: OpenImagePayload) => Promise<void>
  onLinkPress: (url: string) => Promise<void>
  onScrollToAnchor: (id: string) => Promise<void>
  site?: HostCapabilities['site']
  theme: 'dark' | 'light'
  webOrigin: string
}

export function createWebviewHost(deps: WebviewHostDeps): HostCapabilities {
  return {
    apiBase: deps.apiBase,
    diagramPreview: 'openImage',
    enrichments: deps.enrichments,
    fetchJSON: async (url, init) => {
      const target = url.startsWith('http') ? url : `${deps.apiBase}${url}`
      const res = await fetch(target, init)
      if (!res.ok) throw new HostFetchError(res.status, target)
      return res.json()
    },
    labels: deps.labels,
    locale: deps.locale,
    nestedDocPresentation: deps.nestedDocPresentation ?? 'inline',
    openImage: (payload) => {
      if (postNativeImagePreview(payload, deps.webOrigin)) return
      return deps.onImagePress(payload)
    },
    openLink: (url) => deps.onLinkPress(url),
    scrollToAnchor: (id) => deps.onScrollToAnchor(id),
    site: deps.site,
    slots: { CodeBlock: MobileCodeBlock },
    theme: deps.theme,
    webOrigin: deps.webOrigin,
  }
}
