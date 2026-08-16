import { dynamicModule } from '@haklex/rich-compose/modules/dynamic'

import type { HostCapabilities } from '../host'

const CATALOG_SNIPPET_PATH = 's/dynamic-widgets-catalog'

interface DynamicCatalogPayload {
  components?: { url: string }[]
}

const bridge: {
  fetchJSON: HostCapabilities['fetchJSON'] | null
} = { fetchJSON: null }

const catalogUrls = new Set<string>()
let catalogPromise: Promise<void> | null = null

export function setDynamicCatalogHost(host: HostCapabilities) {
  bridge.fetchJSON = host.fetchJSON
}

function ensureDynamicCatalog(): Promise<void> {
  const { fetchJSON } = bridge
  if (!fetchJSON) return Promise.resolve()
  catalogPromise ??= fetchJSON<DynamicCatalogPayload>(
    `/${CATALOG_SNIPPET_PATH}?_t=${Date.now()}`,
  )
    .catch(() => fetchJSON<DynamicCatalogPayload>(`/${CATALOG_SNIPPET_PATH}`))
    .then((catalog) => {
      for (const c of catalog?.components ?? []) catalogUrls.add(c.url)
    })
    .catch(() => {})
  return catalogPromise
}

function isAllowedDynamicUrl(url: string): boolean {
  void ensureDynamicCatalog()
  return catalogUrls.has(url)
}

export const configuredDynamicModule = dynamicModule.setup({
  validateUrl: isAllowedDynamicUrl,
})
