import { Children, isValidElement, type ReactNode } from 'react'

import type { InlineRun } from '../inline-runs'
import {
  InlineMarker,
  type InlineMarkerProps,
  LineBreakMarker,
  RunMarker,
  type RunMarkerProps,
  TextBlockMarker,
  type TextBlockMarkerProps,
} from './markers'

export function collectRuns(
  children: ReactNode,
  patch: Partial<InlineRun> = {},
): InlineRun[] {
  const out: InlineRun[] = []
  Children.forEach(children, (child) => {
    if (typeof child === 'string' || typeof child === 'number') {
      out.push({ ...patch, text: String(child) })
      return
    }
    if (!isValidElement(child)) return
    if (child.type === RunMarker) {
      const { run } = child.props as RunMarkerProps
      out.push({ ...run, ...patch })
      return
    }
    if (child.type === LineBreakMarker) {
      out.push({ text: '\n' })
      return
    }
    if (child.type === TextBlockMarker) {
      const { block } = child.props as TextBlockMarkerProps
      if (out.length > 0) out.push({ text: '\n' })
      out.push(...block.runs.map((run) => ({ ...run, ...patch })))
      return
    }
    if (child.type === InlineMarker) {
      const props = child.props as InlineMarkerProps
      out.push(...collectRuns(props.children, { ...patch, ...props.patch }))
      return
    }
    const props = child.props as { children?: ReactNode }
    if (props.children !== undefined)
      out.push(...collectRuns(props.children, patch))
  })
  return out
}

export function runsText(runs: InlineRun[]): string {
  let text = ''
  for (const run of runs) text += run.text
  return text
}
