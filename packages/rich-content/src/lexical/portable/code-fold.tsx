'use client'

import { type ReactNode, useState } from 'react'

import { shouldCollapseCode } from './code-collapse'
import { useExpandHeight } from './tween-height'

export function CodeFold({
  children,
  code,
}: {
  children: ReactNode
  code: string
}) {
  const long = shouldCollapseCode(code)
  const [expandedFor, setExpandedFor] = useState<string | null>(null)
  const collapsed = long && expandedFor !== code
  const { capture, ref } = useExpandHeight(collapsed)

  return (
    <div
      className={
        collapsed
          ? 'yohaku-code-fold yohaku-code-fold--collapsed'
          : 'yohaku-code-fold'
      }
    >
      <div className="yohaku-code-fold__body" ref={ref}>
        {children}
      </div>
      {collapsed ? (
        <button
          className="yohaku-code-fold__expand"
          type="button"
          onClick={() => {
            capture()
            setExpandedFor(code)
          }}
        >
          <i className="i-mingcute-arrow-to-down-line" />
          <span>展开</span>
        </button>
      ) : null}
    </div>
  )
}
