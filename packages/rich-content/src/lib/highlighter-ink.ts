import type { HighlightOptions, MarkHandle } from '@highlighters/core'

export const accentInkOptions = {
  color: 'var(--color-accent)',
  tip: {
    angle: 10,
  },
  edge: {
    radius: 6,
  },
} satisfies HighlightOptions

export interface AttachMarkInkOptions {
  selectTargets?: (containerEl: HTMLElement) => Element[]
  vivid?: HighlightOptions['vivid']
}

function nearestScrollHost(el: Element): HTMLElement | undefined {
  let cur: HTMLElement | null = el.parentElement
  while (cur && cur !== document.body && cur !== document.documentElement) {
    const cs = getComputedStyle(cur)
    const oy = cs.overflowY
    const ox = cs.overflowX
    if (oy === 'auto' || oy === 'scroll' || ox === 'auto' || ox === 'scroll') {
      return cur
    }
    cur = cur.parentElement
  }
  return undefined
}

export function attachMarkInk(
  containerEl: HTMLElement,
  options: AttachMarkInkOptions = {},
): () => void {
  const { selectTargets = (c) => [c], vivid } = options
  let handles: MarkHandle[] = []
  let cancelled = false

  import('@highlighters/core').then(({ highlight }) => {
    if (cancelled) return
    const targets = selectTargets(containerEl)
    if (targets.length === 0) return
    containerEl.dataset.markInk = ''
    handles = targets.map((el) =>
      highlight(
        el,
        {
          ...accentInkOptions,
          ...(vivid !== undefined ? { vivid } : null),
          animation: { trigger: 'in-view' },
        },
        nearestScrollHost(el),
      ),
    )
  })

  return () => {
    cancelled = true
    delete containerEl.dataset.markInk
    for (const handle of handles) handle.remove()
    handles = []
  }
}

export interface AttachSelectionInkOptions {
  vivid?: HighlightOptions['vivid']
}

export function attachSelectionInk(
  containerEl: HTMLElement,
  options: AttachSelectionInkOptions = {},
): () => void {
  const { vivid } = options
  let handle: MarkHandle | null = null
  let cancelled = false
  let modulePromise: Promise<typeof import('@highlighters/core')> | null = null

  const loadModule = () => {
    if (!modulePromise) modulePromise = import('@highlighters/core')
    return modulePromise
  }

  const teardownHandle = () => {
    handle?.remove()
    handle = null
  }

  const isSelectionInsideContainer = (): boolean => {
    const sel = document.getSelection()
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return false
    const range = sel.getRangeAt(0)
    return containerEl.contains(range.commonAncestorContainer)
  }

  const onSelectionChange = () => {
    if (!isSelectionInsideContainer()) {
      teardownHandle()
      return
    }
    if (handle) return
    loadModule().then(({ highlightSelection }) => {
      if (cancelled || handle) return
      if (!isSelectionInsideContainer()) return
      handle = highlightSelection({
        ...accentInkOptions,
        snap: 'none',
        speed: { enabled: true },
        ...(vivid !== undefined ? { vivid } : null),
      })
    })
  }

  containerEl.dataset.selectionInk = ''
  document.addEventListener('selectionchange', onSelectionChange)
  return () => {
    cancelled = true
    document.removeEventListener('selectionchange', onSelectionChange)
    delete containerEl.dataset.selectionInk
    teardownHandle()
  }
}
