'use client'

import { MermaidRenderer } from '@haklex/rich-compose/modules/mermaid'
import { ColorSchemeProvider } from '@haklex/rich-editor'
import type { Zoom } from 'lumeo'
import mediumZoom from 'lumeo'
import { useEffect, useRef } from 'react'

import { imagePreviewSourceFromElement, useHost } from '../../host'

export const Mermaid = ({ content }: { content: string }) => {
  const host = useHost()
  const isDark = host.theme === 'dark'
  const openImage = host.diagramPreview === 'openImage' ? host.openImage : null
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const containerEl = containerRef.current
    if (!containerEl) return

    if (openImage) {
      const onClick = (event: MouseEvent) => {
        const img = (event.target as HTMLElement).closest('img')
        if (img?.getAttribute('alt') !== 'Mermaid diagram' || !img.src) return
        void openImage({
          images: [img.src],
          index: 0,
          source: imagePreviewSourceFromElement(img),
          src: img.src,
        })
      }
      containerEl.addEventListener('click', onClick)
      return () => containerEl.removeEventListener('click', onClick)
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
      <div className="[&>div]:min-h-0!" ref={containerRef}>
        <MermaidRenderer content={content} />
      </div>
    </ColorSchemeProvider>
  )
}
