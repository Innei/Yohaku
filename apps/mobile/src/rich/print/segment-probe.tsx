import { RichRenderer } from '@haklex/rich-compose/core'
import type { SerializedEditorState } from 'lexical'
import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import { groupSegments, type RichSegment } from '../lexical/group'
import { nativeBlockAnchor, nativeBuiltinOverrides } from '../lexical/overrides'
import { extraNodes } from '../lexical/rich-document'

type Report = (segments: RichSegment[]) => void

const ProbeContext = createContext<Report | null>(null)

function ProbeHost({ children }: { children?: ReactNode }) {
  const report = use(ProbeContext)
  useEffect(() => {
    report?.(groupSegments(children))
  }, [children, report])
  return null
}

interface PendingProbe {
  id: number
  report: Report
  value: SerializedEditorState
}

export function useSegmentProbe() {
  const [pending, setPending] = useState<PendingProbe[]>([])
  const nextIdRef = useRef(0)

  const probe = useCallback(
    (value: SerializedEditorState) =>
      new Promise<RichSegment[]>((resolve) => {
        const id = nextIdRef.current++
        const report: Report = (segments) => {
          setPending((list) => list.filter((entry) => entry.id !== id))
          resolve(segments)
        }
        setPending((list) => [...list, { id, report, value }])
      }),
    [],
  )

  const probes = pending.map((entry) => (
    <ProbeContext key={entry.id} value={entry.report}>
      <RichRenderer
        as={ProbeHost}
        blockAnchor={nativeBlockAnchor}
        builtinNodeOverrides={nativeBuiltinOverrides}
        extraNodes={extraNodes}
        value={entry.value}
      />
    </ProbeContext>
  ))

  return { probe, probes }
}
