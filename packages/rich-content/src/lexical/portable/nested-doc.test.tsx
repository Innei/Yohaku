import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { type HostCapabilities, HostProvider } from '../../host'
import { LexicalNestedDocOverride } from './nested-doc'

const baseHost: HostCapabilities = {
  apiBase: '',
  fetchJSON: async () => ({}) as never,
  labels: {
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

const contentState = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: '标题',
            type: 'text',
            version: 1,
          },
        ],
        direction: null,
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
    ],
    direction: null,
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
} as never

it('renders host-provided labels', () => {
  const html = renderToStaticMarkup(
    <HostProvider host={baseHost}>
      <LexicalNestedDocOverride contentState={contentState} />
    </HostProvider>,
  )
  expect(html).toContain('嵌套文档')
  expect(html).toContain('展开')
})

it('renders closed with aria-expanded="false" before any interaction', () => {
  const html = renderToStaticMarkup(
    <HostProvider host={baseHost}>
      <LexicalNestedDocOverride contentState={contentState} />
    </HostProvider>,
  )
  expect(html).toContain('aria-expanded="false"')
})

it('renders nothing for an empty document', () => {
  const empty = { root: { children: [], type: 'root', version: 1 } } as never
  const html = renderToStaticMarkup(
    <HostProvider host={baseHost}>
      <LexicalNestedDocOverride contentState={empty} />
    </HostProvider>,
  )
  expect(html).toBe('')
})

describe('inline expand/close interaction', () => {
  let mountEl: HTMLDivElement
  let root: Root

  beforeEach(() => {
    mountEl = document.createElement('div')
    document.body.append(mountEl)
    root = createRoot(mountEl)
  })

  afterEach(() => {
    act(() => root.unmount())
    mountEl.remove()
  })

  function renderInline() {
    act(() => {
      root.render(
        <HostProvider host={baseHost}>
          <LexicalNestedDocOverride contentState={contentState} />
        </HostProvider>,
      )
    })
    return mountEl.querySelector('[role="button"]') as HTMLElement
  }

  it('expands on click, flipping aria-expanded and the label', () => {
    const trigger = renderInline()
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(trigger.textContent).toContain('展开')

    act(() => {
      trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(trigger.textContent).toContain('收起')
    expect(trigger.textContent).not.toContain('展开')
  })

  it('stays open when a click inside the expanded content bubbles up', () => {
    const trigger = renderInline()
    act(() => {
      trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(trigger.getAttribute('aria-expanded')).toBe('true')

    // NestedDocRenderer needs a full Lexical editor context to render its
    // own content, which this isolated unit test doesn't set up — so it
    // renders no children here. Append a stand-in descendant instead: what's
    // under test is the DOM-bubbling contract (a click anywhere under the
    // content wrapper must not reach the outer toggle), not what
    // NestedDocRenderer itself draws.
    const contentWrapper = trigger.children[1] as HTMLElement
    const innerLink = document.createElement('a')
    contentWrapper.append(innerLink)

    act(() => {
      innerLink.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(trigger.getAttribute('aria-expanded')).toBe('true')
  })

  it('closes again when the header is clicked while expanded', () => {
    const trigger = renderInline()
    act(() => {
      trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(trigger.getAttribute('aria-expanded')).toBe('true')

    act(() => {
      trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })
})
