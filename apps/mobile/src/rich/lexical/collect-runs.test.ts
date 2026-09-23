import { createElement } from 'react'
import { describe, expect, it } from 'vitest'

import { collectRuns } from './collect-runs'
import { InlineMarker, LineBreakMarker, RunMarker } from './markers'

describe('collectRuns', () => {
  it('flattens nested inline markers and applies patches outside-in', () => {
    const runs = collectRuns([
      createElement(RunMarker, { key: 'a', run: { text: 'plain' } }),
      createElement(
        InlineMarker,
        { key: 'b', patch: { href: 'https://x.y' } },
        createElement(RunMarker, { run: { text: 'link', bold: true } }),
        createElement(
          InlineMarker,
          { patch: { spoiler: true } },
          createElement(RunMarker, { run: { text: 'hidden' } }),
        ),
      ),
      createElement(LineBreakMarker, { key: 'c' }),
    ])
    expect(runs).toEqual([
      { text: 'plain' },
      { text: 'link', bold: true, href: 'https://x.y' },
      { text: 'hidden', href: 'https://x.y', spoiler: true },
      { text: '\n' },
    ])
  })
})
