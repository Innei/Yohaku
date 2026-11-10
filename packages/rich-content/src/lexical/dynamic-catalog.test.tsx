import type { ComponentType, ReactNode } from 'react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it } from 'vitest'

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
