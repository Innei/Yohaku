import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { listPrefetchWindow } from '@/components/list/list-prefetch-window'
import { articleIdsFromVisible } from '@/screens/lists/flatten-posts-list'

import { ingestArticleBodies } from './engine'
import {
  type ListBodyCandidate,
  useListBodyIngest,
} from './use-list-body-ingest'

const native = vi.hoisted(
  (): { parseMarkdown?: () => string } => ({}),
)

vi.mock('@modules/yohaku', () => ({ YohakuNative: native }))
vi.mock('./engine', () => ({
  ingestArticleBodies: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/i18n', () => ({ useLocale: () => 'zh' }))

const rows = Array.from({ length: 40 }, (_, index) => ({
  id: `post-${index}`,
  type: 'post',
}))
const candidates: ListBodyCandidate[] = rows.map(({ id }) => ({
  id,
  kind: 'post',
  bodyVersion: null,
  contentFormat: 'lexical',
  createdAt: new Date('2026-01-01'),
  modifiedAt: null,
}))
let root: ReturnType<typeof createRoot>
let container: HTMLDivElement

function Probe({
  visibleIds,
  items,
}: {
  visibleIds?: string[]
  items: ListBodyCandidate[]
}) {
  useListBodyIngest(items, { visibleIds })
  return null
}
function render(indices?: number[], items = candidates) {
  const visibleIds =
    indices === undefined
      ? undefined
      : articleIdsFromVisible(
          listPrefetchWindow(
            rows,
            indices.map((index) => ({ index, isViewable: true })),
          ),
        )
  act(() => root.render(createElement(Probe, { items, visibleIds })))
}
async function settle() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300)
  })
}

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  vi.useFakeTimers()
  vi.clearAllMocks()
  container = document.createElement('div')
  root = createRoot(container)
})
afterEach(() => {
  act(() => root.unmount())
  vi.useRealTimers()
})

describe('visible list body fetching', () => {
  it('waits for visibility, batches the settled window with two-row prefetch, and drops a rapid-scroll window', async () => {
    render()
    await settle()
    expect(ingestArticleBodies).not.toHaveBeenCalled()
    render([2, 3])
    render([12, 10, 11])
    await settle()
    expect(ingestArticleBodies).toHaveBeenCalledExactlyOnceWith(
      candidates.slice(8, 15).map(({ id, kind }) => ({ id, kind })),
      'zh',
    )
    render([39])
    await settle()
    expect(vi.mocked(ingestArticleBodies).mock.calls[1][0]).toEqual(
      candidates.slice(37).map(({ id, kind }) => ({ id, kind })),
    )
  })

  it('ingests markdown bodies when the binary can render them', async () => {
    native.parseMarkdown = () => '{}'
    const items = candidates.map((item, index) => ({
      ...item,
      ...(index === 2 ? { contentFormat: 'markdown' } : {}),
    }))
    render([2], items)
    await settle()
    delete native.parseMarkdown
    expect(vi.mocked(ingestArticleBodies).mock.calls[0][0]).toContainEqual({
      id: 'post-2',
      kind: 'post',
    })
  })

  it('skips cached, protected and web-only markdown bodies; clears pending work for an empty window', async () => {
    const items = candidates.map((item, index) => ({
      ...item,
      ...(index === 0 ? { bodyVersion: Date.parse('2026-01-01') } : {}),
      ...(index === 1 ? { hasPassword: true } : {}),
      ...(index === 2 ? { contentFormat: 'markdown' } : {}),
    }))
    render([0, 1, 2], items)
    await settle()
    expect(ingestArticleBodies).toHaveBeenCalledExactlyOnceWith(
      [
        { id: 'post-3', kind: 'post' },
        { id: 'post-4', kind: 'post' },
      ],
      'zh',
    )
    render([20])
    render([])
    await settle()
    expect(ingestArticleBodies).toHaveBeenCalledTimes(1)
  })

  it('passes the entire window to the ingest engine, which chunks requests into server-sized batches', async () => {
    render(Array.from({ length: 25 }, (_, index) => index))
    await settle()
    expect(vi.mocked(ingestArticleBodies).mock.calls[0][0]).toHaveLength(27)
  })

  it('does not fetch header IDs or invalid view tokens', () => {
    const mixed = [
      { id: '__year', type: 'year' },
      { id: 'note-1', type: 'note' },
    ]
    expect(
      articleIdsFromVisible(
        listPrefetchWindow(mixed, [{ index: 0, isViewable: true }]),
        ['note'],
      ),
    ).toEqual(['note-1'])
    expect(
      listPrefetchWindow(rows, [
        { index: null, isViewable: true },
        { index: -1, isViewable: true },
        { index: 40, isViewable: true },
        { index: 5, isViewable: false },
      ]),
    ).toEqual([])
  })
})
