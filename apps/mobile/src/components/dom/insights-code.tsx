import { isValidElement, type ReactNode } from 'react'

import { InsightsMermaid } from './insights-mermaid'

export function fenceLang(className: unknown): string | undefined {
  const match = /(?:language-|lang-)(\w+)/.exec(String(className ?? ''))
  return match?.[1]
}

function fenceText(children: unknown): string {
  return String(children ?? '').replace(/\n$/, '')
}

export function InsightsPre({ children }: { children?: ReactNode }) {
  const child = isValidElement(children)
    ? children
    : Array.isArray(children)
      ? children[0]
      : null
  if (isValidElement<{ children?: unknown; className?: string }>(child)) {
    const lang = fenceLang(child.props.className)
    const text = fenceText(child.props.children)
    if (lang === 'mermaid') {
      return (
        <div className="insights-mermaid">
          <InsightsMermaid content={text} />
        </div>
      )
    }
  }
  return <pre className="insights-pre">{children}</pre>
}
