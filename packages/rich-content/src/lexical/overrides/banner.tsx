'use client'

import type { BannerRendererProps } from '@haklex/rich-editor/renderers'

type BannerType = BannerRendererProps['type']

const BANNER_LABELS: Record<BannerType, string> = {
  note: 'Note',
  tip: 'Tip',
  important: 'Important',
  warning: 'Warning',
  caution: 'Caution',
}

const KNOWN_TYPES = new Set<BannerType>([
  'note',
  'tip',
  'important',
  'warning',
  'caution',
])

function normalizeType(type: BannerType): BannerType {
  return KNOWN_TYPES.has(type) ? type : 'note'
}

export function LexicalBannerOverride({ type }: BannerRendererProps) {
  const safeType = normalizeType(type)
  return (
    <>
      <span
        aria-hidden
        className="rich-banner-yohaku-dot"
        data-type={safeType}
      />
      <div className="rich-banner-yohaku-header" data-type={safeType}>
        {BANNER_LABELS[safeType]}
      </div>
    </>
  )
}
