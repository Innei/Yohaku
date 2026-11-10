import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'

import { type HostCapabilities, HostProvider } from '../host'
import { collectLexicalNodeTypes } from './collect-node-types'
import {
  createYohakuLexicalRenderer,
  REGISTERED_NODE_TYPES,
} from './create-renderer'
import { withLexicalElementDefaults } from './element-defaults'
import { sanitizeEditorState } from './sanitize'
import fixture from './__fixtures__/print-lab.json'

const host: HostCapabilities = {
  apiBase: 'https://example.com/api',
  fetchJSON: async () => ({}) as never,
  labels: {
    codeCopied: '已复制',
    codeCopy: '复制',
    codeExpand: '展开 · {count} 行',
    nestedDocCollapse: '收起',
    nestedDocExpand: '展开',
    nestedDocLabel: '嵌套文档',
  },
  nestedDocPresentation: 'inline',
  openImage: () => {},
  openLink: () => {},
  scrollToAnchor: () => {},
  theme: 'light',
  webOrigin: 'https://example.com',
}

it('print lab fixture covers every registered node type', () => {
  const types = collectLexicalNodeTypes(fixture)
  const missing = [...REGISTERED_NODE_TYPES].filter((type) => !types.has(type))
  expect(missing.sort()).toEqual([])
})

it('print mode replaces interactive blocks with captions', () => {
  const RichContent = createYohakuLexicalRenderer()
  const state = sanitizeEditorState(
    withLexicalElementDefaults(fixture) as never,
    REGISTERED_NODE_TYPES,
  )
  const html = renderToStaticMarkup(
    <HostProvider
      host={{
        ...host,
        printCaption: (kind) => `PRINT:${kind}`,
        printMode: true,
      }}
    >
      <RichContent theme="light" value={state} variant="article" />
    </HostProvider>,
  )
  expect(html).toContain('print-block-fallback')
  expect(html).toContain('PRINT:poll')
  expect(html).toContain('PRINT:map')
  expect(html).toContain('PRINT:video')
  expect(html).toContain('PRINT:embed')
  expect(html).toContain('PRINT:excalidraw')
  expect(html).toContain('PRINT:afilmory')
  expect(html).not.toContain('<video')
})

it('print mode opens every fold and keeps code on the page', () => {
  const RichContent = createYohakuLexicalRenderer()
  const state = sanitizeEditorState(
    withLexicalElementDefaults(fixture) as never,
    REGISTERED_NODE_TYPES,
  )
  const html = renderToStaticMarkup(
    <HostProvider
      host={{
        ...host,
        printCaption: (kind) => `PRINT:${kind}`,
        printMode: true,
      }}
    >
      <RichContent theme="light" value={state} variant="article" />
    </HostProvider>,
  )
  expect(html).toContain('可见内容。')
  expect(html).toContain('默认隐藏。')
  expect(html.match(/<details[^>]*open/g)?.length).toBeGreaterThanOrEqual(2)
  expect(html).toContain('const x = 1')
  expect(html).toContain('fn main() {}')
  expect(html).toContain('echo hi')
  expect(html).not.toContain('yohaku-code--collapsed')
})
