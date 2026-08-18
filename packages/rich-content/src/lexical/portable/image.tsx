'use client'

import { ComposedImageRenderer } from '@haklex/rich-compose/modules/image'
import type { ImageRendererProps } from '@haklex/rich-editor/renderers'
import { useCallback, useState } from 'react'
import { createPortal } from 'react-dom'

import { ImageExifOverlay } from './exif-overlay'

const RICH_IMAGE_FRAME_CLASS = 'rr-image-frame'

export function LexicalImageOverride(props: ImageRendererProps) {
  const [frame, setFrame] = useState<HTMLElement | null>(null)

  const handleRootRef = useCallback((node: HTMLDivElement | null) => {
    const nextFrame =
      node?.querySelector<HTMLElement>(`.${RICH_IMAGE_FRAME_CLASS}`) ?? null

    setFrame(nextFrame)
  }, [])

  return (
    <div ref={handleRootRef} style={{ display: 'contents' }}>
      <ComposedImageRenderer {...props} />
      {frame ? createPortal(<ImageExifOverlay src={props.src} />, frame) : null}
    </div>
  )
}
