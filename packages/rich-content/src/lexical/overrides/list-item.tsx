'use client'

import type { BuiltinNodeRenderer } from '@haklex/rich-compose'

export const LexicalListItemOverride: BuiltinNodeRenderer = (
  node,
  key,
  children,
  defaultRenderer,
) => {
  const checked = (node as { checked?: boolean }).checked
  if (checked === undefined) return defaultRenderer()

  return (
    <li
      className="yohaku-checklist-item"
      data-checked={checked ? 'true' : 'false'}
      key={key}
    >
      {children}
    </li>
  )
}
