import type { ComponentType, ReactNode } from 'react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'

import type { HostCapabilities } from '../host'
import {
  configuredDynamicModule,
  setDynamicCatalogHost,
} from './dynamic-catalog'

it('holds the dynamic renderer until the allowlist catalog settles', async () => {
  const Provider = configuredDynamicModule.Provider as ComponentType<{
    children: ReactNode
  }>
  const Dynamic = configuredDynamicModule.renderers!.Dynamic as ComponentType<{
    initialHeight: number
    url: string
  }>
  const el = document.createElement('div')
  const root = createRoot(el)

  await act(async () => {
    root.render(
      <Provider>
        <Dynamic initialHeight={120} url="https://cdn.example.com/w.js" />
      </Provider>,
    )
  })
  expect(el.textContent).toBe('')

  let resolveCatalog!: (v: unknown) => void
  setDynamicCatalogHost({
    fetchJSON: () =>
      new Promise((resolve) => {
        resolveCatalog = resolve
      }),
  } as unknown as HostCapabilities)
  await act(async () => {
    resolveCatalog({ components: [{ url: 'https://cdn.example.com/w.js' }] })
  })

  expect(el.textContent).not.toBe('')
  expect(el.textContent).not.toContain('Failed to load component')
  act(() => root.unmount())
})

async function loadCatalog(catalog: unknown) {
  vi.resetModules()
  const mod = await import('./dynamic-catalog')
  mod.setDynamicCatalogHost({
    fetchJSON: () => Promise.resolve(catalog),
  } as unknown as HostCapabilities)
  await new Promise((resolve) => setTimeout(resolve))
  return mod.isAllowedDynamicUrl
}

const revisedCatalog = {
  version: 1,
  components: [
    {
      url: 'https://cdn.example.com/w-v3.js',
      previousUrls: [
        'https://cdn.example.com/w-v1.js',
        'https://cdn.example.com/w-v2.js',
      ],
    },
    {
      url: 'https://cdn.example.com/fork.js',
      parentUrl: 'https://cdn.example.com/original.js',
    },
  ],
}

it.each([
  'https://cdn.example.com/w-v3.js',
  'https://cdn.example.com/w-v1.js',
  'https://cdn.example.com/w-v2.js',
  'https://cdn.example.com/fork.js',
  'https://cdn.example.com/original.js',
])('allows %s from the catalog, its previousUrls or parentUrl', async (url) => {
  const isAllowed = await loadCatalog(revisedCatalog)
  expect(isAllowed(url)).toBe(true)
})

it('rejects a url absent from the catalog', async () => {
  const isAllowed = await loadCatalog(revisedCatalog)
  expect(isAllowed('https://cdn.example.com/unknown.js')).toBe(false)
})
