'use client'

import type { BuiltinNodeRenderer } from '@haklex/rich-compose'
import type { ReactNode } from 'react'

import { useOptionalHost } from '../../host'

function DetailsView({
  children,
  open,
  summary,
}: {
  children: ReactNode
  open?: boolean
  summary: string
}) {
  const printMode = Boolean(useOptionalHost()?.printMode)
  return (
    <details className="yohaku-details" open={printMode || open || undefined}>
      <summary className="yohaku-details-summary">
        <span className="yohaku-details-summary-text">{summary}</span>
      </summary>
      <div className="yohaku-details-content">{children}</div>
    </details>
  )
}

export const LexicalDetailsOverride: BuiltinNodeRenderer = (
  node,
  key,
  children,
) => {
  const { open, summary } = node as { open?: boolean; summary?: string }
  return (
    <DetailsView key={key} open={open} summary={summary || ''}>
      {children}
    </DetailsView>
  )
}
