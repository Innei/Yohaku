import { expect, it } from 'vitest'

import fixture from './__fixtures__/print-lab.json'
import { withLexicalElementDefaults } from './element-defaults'

it('gives list items a numeric indent', () => {
  const next = withLexicalElementDefaults(fixture) as {
    root: { children: { children?: { indent?: unknown; type?: string }[] }[] }
  }
  const item = next.root.children
    .flatMap((node) => node.children ?? [])
    .find((node) => node.type === 'listitem')
  expect(item?.indent).toBe(0)
})
