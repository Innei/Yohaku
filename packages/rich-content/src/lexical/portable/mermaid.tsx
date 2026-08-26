'use client'
import { sx } from '../../lib/sx'
import { atoms } from '../../styles/atoms.stylex'

import { MermaidRenderer } from '@haklex/rich-compose/modules/mermaid'
import { ColorSchemeProvider } from '@haklex/rich-editor'
import type { Zoom } from 'lumeo'
import mediumZoom from 'lumeo'
import { useEffect, useRef } from 'react'

import {
  imagePreviewSourceFromElement,
  type OpenImagePayload,
  useHost,
} from '../../host'
import {
  rasterizeLoadedImageToPng,
  rasterizeSvgMarkupToPng,
  svgMarkupFromDataUrl,
} from '../../lib/rasterize-to-png'

function isSvgDataUrl(src: string) {
  return src.startsWith('data:image/svg+xml')
}

async function rasterizeMermaidImg(img: HTMLImageElement) {
  const svg = svgMarkupFromDataUrl(img.src)
  if (!svg) return rasterizeLoadedImageToPng(img)
  try {
    return await rasterizeSvgMarkupToPng(svg)
  } catch {
    return rasterizeLoadedImageToPng(img)
  }
}

const painting = new WeakMap<HTMLImageElement, Promise<void>>()

async function paintMermaidPng(img: HTMLImageElement) {
  if (!isSvgDataUrl(img.src)) return
  const pending = painting.get(img)
  if (pending) return pending
  const work = (async () => {
    const png = await rasterizeMermaidImg(img)
    if (!png || !img.isConnected || !isSvgDataUrl(img.src)) return
    img.src = png
  })()
  painting.set(img, work)
  try {
    await work
  } finally {
    painting.delete(img)
  }
}

async function previewMermaidImage(
  img: HTMLImageElement,
  openImage: (payload: OpenImagePayload) => void | Promise<void>,
) {
  if (isSvgDataUrl(img.src)) await paintMermaidPng(img)
  const src = img.src
  await openImage({
    images: [src],
    index: 0,
    source: imagePreviewSourceFromElement(img, src),
    src,
  })
}

export const Mermaid = ({ content }: { content: string }) => {
  const host = useHost()
  const isDark = host.theme === 'dark'
  const openImage = host.diagramPreview === 'openImage' ? host.openImage : null
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const containerEl = containerRef.current
    if (!containerEl) return

    if (openImage) {
      let cancelled = false
      const paint = () => {
        const img = containerEl.querySelector<HTMLImageElement>(
          'img[alt="Mermaid diagram"]',
        )
        if (!img || cancelled) return
        void paintMermaidPng(img)
      }
      paint()
      const observer = new MutationObserver(paint)
      observer.observe(containerEl, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['src'],
      })
      const onClick = (event: MouseEvent) => {
        const img = (event.target as HTMLElement).closest('img')
        if (img?.getAttribute('alt') !== 'Mermaid diagram' || !img.src) return
        void previewMermaidImage(img, openImage)
      }
      containerEl.addEventListener('click', onClick)
      return () => {
        cancelled = true
        observer.disconnect()
        containerEl.removeEventListener('click', onClick)
      }
    }

    const zoom: Zoom = mediumZoom({
      background: isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.95)',
      margin: 24,
    })

    const attach = () => {
      const img = containerEl.querySelector<HTMLImageElement>(
        'img[alt="Mermaid diagram"]',
      )
      if (!img) return
      zoom.detach()
      zoom.attach(img)
    }

    attach()

    const observer = new MutationObserver(attach)
    observer.observe(containerEl, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['src'],
    })

    return () => {
      observer.disconnect()
      zoom.detach()
    }
  }, [content, isDark, openImage])

  return (
    <ColorSchemeProvider colorScheme={isDark ? 'dark' : 'light'}>
      {/* min-h override: @haklex/rich-compose <= 0.29.0 keeps its estimated
          placeholder min-height on the rendered diagram, leaving large blank
          space; drop once the upstream fix ships. */}
      <div {...sx(atoms._and_div_min_h_0important_)} ref={containerRef}>
        <MermaidRenderer content={content} />
      </div>
    </ColorSchemeProvider>
  )
}
