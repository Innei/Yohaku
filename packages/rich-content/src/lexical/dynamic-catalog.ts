import type { RichRendererModule } from '@haklex/rich-compose'
import { dynamicModule } from '@haklex/rich-compose/modules/dynamic'
import type { ComponentType } from 'react'
import { createElement, useSyncExternalStore } from 'react'

import type { HostCapabilities } from '../host'

const CATALOG_SNIPPET_PATH = 's/dynamic-widgets-catalog'

interface DynamicCatalogPayload {
  components?: { url: string }[]
}

const catalogUrls = new Set<string>()
const listeners = new Set<() => void>()
let catalogPromise: Promise<void> | null = null
let catalogSettled = false

export function setDynamicCatalogHost(host: HostCapabilities) {
  const { fetchJSON } = host
  catalogPromise ??= fetchJSON<DynamicCatalogPayload>(
    `/${CATALOG_SNIPPET_PATH}?_t=${Date.now()}`,
  )
    .catch(() => fetchJSON<DynamicCatalogPayload>(`/${CATALOG_SNIPPET_PATH}`))
    .then((catalog) => {
      for (const c of catalog?.components ?? []) catalogUrls.add(c.url)
    })
    .catch(() => {})
    .finally(() => {
      catalogSettled = true
      for (const listener of listeners) listener()
    })
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function useCatalogSettled() {
  return useSyncExternalStore(
    subscribe,
    () => catalogSettled,
    () => false,
  )
}

function isAllowedDynamicUrl(url: string): boolean {
  return catalogUrls.has(url)
}

// validateUrl is synchronous and the host renderer rejects once per mount, so
// mounting before the allowlist arrives fails until the reader hits Retry.
function gateOnCatalog(
  Renderer: ComponentType<object>,
): ComponentType<{ initialHeight?: number }> {
  return function CatalogGatedRenderer(props) {
    if (!useCatalogSettled())
      return createElement('div', { style: { minHeight: props.initialHeight } })
    return createElement(Renderer, props)
  }
}

const baseDynamicModule = dynamicModule.setup({
  validateUrl: isAllowedDynamicUrl,
})

export const configuredDynamicModule: RichRendererModule = {
  ...baseDynamicModule,
  renderers: Object.fromEntries(
    Object.entries(baseDynamicModule.renderers ?? {}).map(([key, Comp]) => [
      key,
      gateOnCatalog(Comp as ComponentType<object>),
    ]),
  ),
}
