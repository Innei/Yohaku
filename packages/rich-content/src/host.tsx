'use client'

import { type ComponentType, createContext, type ReactNode, use } from 'react'

export interface InlineLinkProps {
  children: ReactNode
  className?: string
  href: string
  rel?: string
  target?: string
}

export interface StockKLineProps {
  ema?: [number, number] | false
  range: { from: string; interval: '5m' | '15m' | '1h' | '1d'; to: string }
  symbol: string
}

export interface MapSlotProps {
  locale?: string
  pois?: unknown[]
  title?: string
  track?: { url?: string }
  view?: unknown
}

export interface HostEnrichmentImage {
  alt?: string
  height?: number
  thumbhash?: string
  url: string
  width?: number
}

export interface HostEnrichment {
  category?: string
  description?: string
  image?: HostEnrichmentImage
  subtype?: string
  title: string
  url: string
}

export interface ImagePreviewSource {
  borderRadius: number
  currentSrc: string
  objectFit: string
  objectPosition: string
  rect: {
    height: number
    width: number
    x: number
    y: number
  }
}

export interface OpenImagePayload {
  images: string[]
  index: number
  source?: ImagePreviewSource
  src: string
}

export function imagePreviewSourceFromElement(
  element: HTMLImageElement,
): ImagePreviewSource {
  const rect = element.getBoundingClientRect()
  const style = window.getComputedStyle(element)
  const radii = [
    style.borderTopLeftRadius,
    style.borderTopRightRadius,
    style.borderBottomRightRadius,
    style.borderBottomLeftRadius,
  ].map((value) => Number.parseFloat(value) || 0)
  return {
    borderRadius: Math.max(...radii),
    currentSrc: element.currentSrc || element.src,
    objectFit: style.objectFit || 'contain',
    objectPosition: style.objectPosition || '50% 50%',
    rect: {
      height: rect.height,
      width: rect.width,
      x: rect.x,
      y: rect.y,
    },
  }
}

export class HostFetchError extends Error {
  status: number

  constructor(status: number, url: string) {
    super(`fetchJSON failed (${status}): ${url}`)
    this.name = 'HostFetchError'
    this.status = status
  }
}

export interface HostCapabilities {
  apiBase: string
  // medium-zoom positions its overlay against the whole document, which is
  // unusable inside a matchContents WebView (document height = full article).
  // 'openImage' hosts divert diagram zoom into the openImage pipeline instead.
  diagramPreview?: 'openImage' | 'zoom'
  // Article responses hydrate link-card data server-side (mx-core
  // meta.enrichments, keyed by the exact URL in the document). Hosts thread
  // that map through instead of fetching /enrichment/resolve from the client
  // — the endpoint is origin-guarded and the map is already in the payload.
  enrichments?: Record<string, HostEnrichment>
  // An absolute URL (afilmory's galleryUrl is an off-site address) is used
  // as-is; a relative path gets apiBase prefixed by the implementation, not
  // by callers — package call sites pass relative paths and never touch
  // apiBase themselves. Implementations must reject with HostFetchError
  // (not a bare Error) on a non-ok response — callers branch on `.status`
  // (e.g. 404 vs transient), not on the error message text.
  fetchJSON<T>(url: string, init?: RequestInit): Promise<T>
  labels: {
    nestedDocCollapse: string
    nestedDocExpand: string
    nestedDocLabel: string
  }
  // BCP-47 tag for Intl formatting (stock numbers/dates). Undefined lets
  // Intl fall back to the runtime default locale.
  locale?: string
  nestedDocPresentation: 'inline' | 'modal'
  openImage(payload: OpenImagePayload): void | Promise<void>
  openLink(url: string): void | Promise<void>
  scrollToAnchor(id: string): void | Promise<void>
  slots?: {
    BlockLinkCard?: ComponentType<{ fallback?: ReactNode; url: string }>
    CodeBlock?: ComponentType<{
      code: string
      fold?: boolean
      language?: string
    }>
    InlineLink?: ComponentType<InlineLinkProps>
    MapBlock?: ComponentType<MapSlotProps>
    StockKLine?: ComponentType<StockKLineProps>
  }
  theme: 'dark' | 'light'
  // The configured site URL, not the browsing origin (window.location.origin)
  // — they diverge in dev, and this may be '' before it's known. Don't assume
  // webOrigin === location.origin.
  webOrigin: string
}

const HostContext = createContext<HostCapabilities | null>(null)

export function HostProvider({
  children,
  host,
}: {
  children: ReactNode
  host: HostCapabilities
}) {
  return <HostContext value={host}>{children}</HostContext>
}

export function useHost(): HostCapabilities {
  const host = use(HostContext)
  if (!host) {
    throw new Error('useHost must be called inside <HostProvider>')
  }
  return host
}
