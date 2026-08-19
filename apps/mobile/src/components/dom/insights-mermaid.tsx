import {
  imagePreviewSourceFromElement,
  useHost,
} from '@yohaku/rich-content/host'
import { rasterizeLoadedImageToPng } from '@yohaku/rich-content/src/lib/rasterize-to-png.ts'
import { renderMermaidSVG } from 'beautiful-mermaid'
import { useEffect, useMemo, useRef } from 'react'

const LIGHT_PALETTE = { bg: '#ffffff', fg: '#262626' }
const DARK_PALETTE = { bg: '#171717', fg: '#fafafa' }

function svgToDataUrl(svg: string): string {
  const bytes = new TextEncoder().encode(svg)
  let binary = ''
  for (const byte of bytes) binary += String.fromCodePoint(byte)
  return `data:image/svg+xml;base64,${btoa(binary)}`
}

function readDimensions(svg: string): { height?: number; width?: number } {
  const match = svg.match(/viewBox="\s*(?:[\d.-]+\s+){2}([\d.]+)\s+([\d.]+)/)
  if (!match) return {}
  return {
    height: Number.parseFloat(match[2]),
    width: Number.parseFloat(match[1]),
  }
}

export function InsightsMermaid({ content }: { content: string }) {
  const host = useHost()
  const isDark = host.theme === 'dark'
  const openImage = host.diagramPreview === 'openImage' ? host.openImage : null
  const containerRef = useRef<HTMLDivElement>(null)

  const rendered = useMemo(() => {
    if (!content) {
      return { error: '', height: undefined, imgSrc: '', width: undefined }
    }
    try {
      const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE
      const svg = renderMermaidSVG(content, {
        bg: palette.bg,
        fg: palette.fg,
      })
      const { height, width } = readDimensions(svg)
      return { error: '', height, imgSrc: svgToDataUrl(svg), width }
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : String(err),
        height: undefined,
        imgSrc: '',
        width: undefined,
      }
    }
  }, [content, isDark])

  useEffect(() => {
    const containerEl = containerRef.current
    if (!containerEl || !openImage) return

    const onClick = (event: MouseEvent) => {
      const img = (event.target as HTMLElement).closest('img')
      if (img?.getAttribute('alt') !== 'Mermaid diagram' || !img.src) return
      const png = rasterizeLoadedImageToPng(img)
      const src = png ?? img.src
      void openImage({
        images: [src],
        index: 0,
        source: imagePreviewSourceFromElement(img, src),
        src,
      })
    }
    containerEl.addEventListener('click', onClick)
    return () => containerEl.removeEventListener('click', onClick)
  }, [openImage])

  if (!rendered.imgSrc) {
    return (
      <div className="insights-mermaid-error" ref={containerRef}>
        {rendered.error || 'Render failed'}
      </div>
    )
  }

  return (
    <div ref={containerRef}>
      <img
        alt="Mermaid diagram"
        height={rendered.height}
        src={rendered.imgSrc}
        width={rendered.width}
      />
    </div>
  )
}
