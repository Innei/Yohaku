'use client'

import type { BuiltinNodeRenderer } from '@haklex/rich-compose'

export const LexicalDetailsOverride: BuiltinNodeRenderer = (
  node,
  key,
  children,
) => {
  const { open, summary } = node as { open?: boolean; summary?: string }

  return (
    <details className="yohaku-details" key={key} open={open || undefined}>
      <summary className="yohaku-details-summary">
        <span className="yohaku-details-summary-text">{summary || ''}</span>
      </summary>
      <div className="yohaku-details-content">{children}</div>
    </details>
  )
}
