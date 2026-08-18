import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { type HostCapabilities, HostProvider } from '../host'
import fixture from './__fixtures__/all-blocks.json'
import {
  createYohakuLexicalRenderer,
  REGISTERED_NODE_TYPES,
} from './create-renderer'
import { sanitizeEditorState } from './sanitize'

const mobileHost: HostCapabilities = {
  apiBase: 'https://example.com/api',
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

// A host that DOES supply slots, shaped like web's — the only way to exercise
// the slot-forwarding branch (mobileHost never sets `slots`, so a fixture
// render against it alone can never observe what a slot actually receives).
const webLikeHost: HostCapabilities = {
  ...mobileHost,
  slots: {
    BlockLinkCard: ({ fallback, url }) => (
      <div data-block-link-card-slot={url}>{fallback}</div>
    ),
  },
}

const RichContent = createYohakuLexicalRenderer()

function render(host: HostCapabilities = mobileHost) {
  const state = sanitizeEditorState(fixture as never, REGISTERED_NODE_TYPES)
  return renderToStaticMarkup(
    <HostProvider host={host}>
      <RichContent theme="light" value={state} variant="article" />
    </HostProvider>,
  )
}

it.each([
  ['heading', 'rich-heading-h2'],
  ['quote', 'rich-quote-yohaku'],
  ['checklist', 'yohaku-checklist-item'],
  ['details', 'yohaku-details'],
  ['alert', 'rich-alert-yohaku-label'],
  ['banner', 'rich-banner-yohaku-dot'],
  ['table', 'rich-table-scroll'],
  ['code', 'rich-code-block'],
  ['image', 'rr-image-root'],
  // Not 'Pick one': once a PollDataAdapter is wired (see the poll-adapter
  // describe block below), the initial SSR pass is PollInteractive's loading
  // skeleton, not PollStaticFallback — animate-pulse is what proves the
  // interactive branch was taken instead of the static fallback.
  ['poll', 'animate-pulse'],
  ['stock', 'AAPL'],
  ['afilmory', 'AFILMORY'],
  ['inline link', 'rich-link'],
  ['link-card', 'https://link-card.example.com'],
])('renders the %s block with its yohaku class', (_name, className) => {
  expect(render()).toContain(className)
})

it('degrades an unregistered node to a placeholder instead of throwing', () => {
  const html = render()
  expect(html).toContain('请在网页中查看')
  // BlockBoundary's own fallback text also contains "请在网页中查看" — assert its
  // distinguishing half is absent so this only proves the sanitize placeholder
  // fired, not that some biz block silently crashed into its error boundary.
  expect(html).not.toContain('渲染失败')
})

it('falls back to the static map card when no MapBlock slot is provided', () => {
  expect(render()).toContain('在网页中打开')
})

it('forwards the paragraph-conversion fallback into a provided BlockLinkCard slot', () => {
  const html = render(webLikeHost)
  const marker = 'data-block-link-card-slot="https://bare-url.example.com"'
  expect(html).toContain(marker)
  // The fallback must be nested INSIDE the slot marker's own output — proving
  // the package actually forwarded it, not merely that the marker rendered.
  const afterMarker = html.slice(
    html.indexOf(marker),
    html.indexOf(marker) + 400,
  )
  expect(afterMarker).toContain('rich-link')
  expect(afterMarker).toContain('bare-url.example.com')
})

it('forwards the link-card node fallback into a provided BlockLinkCard slot', () => {
  const html = render(webLikeHost)
  const marker = 'data-block-link-card-slot="https://link-card.example.com"'
  expect(html).toContain(marker)
  const afterMarker = html.slice(
    html.indexOf(marker),
    html.indexOf(marker) + 200,
  )
  expect(afterMarker).toContain('href="https://link-card.example.com"')
})

// I-1: usePortablePollAdapter used to have zero call sites, so a host with no
// PollDataProvider of its own (mobile) always fell to PollStaticFallback —
// question + bare labels, no tallies, no vote affordance. The SSR fixture
// test above only proves the interactive branch is now taken; this proves
// the package's own default adapter round-trips a real fetch into rendered
// vote percentages, the thing the static fallback could never show.
describe('poll adapter wiring (I-1)', () => {
  const pollOnlyState = {
    root: {
      children: [
        {
          mode: 'single',
          options: [
            { id: 'o1', label: 'Option A' },
            { id: 'o2', label: 'Option B' },
          ],
          pollId: 'p1',
          question: 'Pick one',
          showResults: 'always',
          type: 'poll',
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

  let mountEl: HTMLDivElement
  let mountRoot: Root

  beforeEach(() => {
    mountEl = document.createElement('div')
    document.body.append(mountEl)
    mountRoot = createRoot(mountEl)
  })

  afterEach(() => {
    act(() => mountRoot.unmount())
    mountEl.remove()
  })

  it('renders vote tallies through the package default adapter when the host supplies no PollDataProvider of its own', async () => {
    const host: HostCapabilities = {
      ...mobileHost,
      fetchJSON: async (url) => {
        if (String(url).includes('/proxy/polls/')) {
          return {
            canVote: false,
            closed: false,
            status: 'success',
            tallies: { o1: 3, o2: 1 },
            totalVotes: 4,
            userVote: ['o1'],
          } as never
        }
        return {} as never
      },
    }
    const state = sanitizeEditorState(pollOnlyState, REGISTERED_NODE_TYPES)

    await act(async () => {
      mountRoot.render(
        <HostProvider host={host}>
          <RichContent theme="light" value={state} variant="article" />
        </HostProvider>,
      )
    })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(mountEl.querySelector('.animate-pulse')).toBeNull()
    expect(mountEl.textContent).toContain('Option A')
    expect(mountEl.textContent).toContain('Option B')
    expect(mountEl.textContent).toContain('75%')
    expect(mountEl.textContent).toContain('25%')
    expect(mountEl.textContent).toContain('4')
  })
})
