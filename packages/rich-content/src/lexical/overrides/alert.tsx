'use client'

import type { AlertRendererProps } from '@haklex/rich-editor/renderers'

type AlertType = AlertRendererProps['type']

const ALERT_LABELS: Record<AlertType, string> = {
  note: 'Note',
  tip: 'Tip',
  important: 'Important',
  warning: 'Warning',
  caution: 'Caution',
}

const KNOWN_TYPES = new Set<AlertType>([
  'note',
  'tip',
  'important',
  'warning',
  'caution',
])

function normalizeType(type: AlertType): AlertType {
  return KNOWN_TYPES.has(type) ? type : 'note'
}

export function LexicalAlertOverride({ type }: AlertRendererProps) {
  const safeType = normalizeType(type)
  return (
    <div className="rich-alert-yohaku-label" data-type={safeType}>
      <span className="rich-alert-yohaku-label-text">
        {ALERT_LABELS[safeType]}
      </span>
    </div>
  )
}
