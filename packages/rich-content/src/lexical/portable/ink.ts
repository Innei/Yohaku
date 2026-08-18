import { semanticClassNames } from '@haklex/rich-editor/styles'
import type { RefObject } from 'react'
import { useEffect } from 'react'

import { useHost } from '../../host'
import { attachMarkInk } from '../../lib/highlighter-ink'

export function useMarkInk(
  containerRef: RefObject<HTMLElement | null>,
  contentKey: string,
) {
  const isDark = useHost().theme === 'dark'

  useEffect(() => {
    const containerEl = containerRef.current
    if (!containerEl) return
    return attachMarkInk(containerEl, {
      selectTargets: (c) => [
        ...c.querySelectorAll(`.${semanticClassNames.textHighlight}`),
      ],
      vivid: isDark ? 'screen' : undefined,
    })
  }, [containerRef, contentKey, isDark])
}
