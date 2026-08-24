export const PREVIEW_MAX_PIXEL = 4096

function fitPixelSize(
  width: number,
  height: number,
  maxPixel = PREVIEW_MAX_PIXEL,
): { height: number; width: number } | null {
  if (!(width > 0) || !(height > 0)) return null
  const longest = Math.max(width, height)
  const scale = longest > maxPixel ? maxPixel / longest : 1
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

function previewPixelSize(
  width: number,
  height: number,
  maxPixel = PREVIEW_MAX_PIXEL,
): { height: number; width: number } | null {
  if (!(width > 0) || !(height > 0)) return null
  const dpr = typeof window === 'undefined' ? 2 : window.devicePixelRatio || 2
  const scale = Math.min(maxPixel / Math.max(width, height), Math.max(2, dpr))
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

function readSvgOpenTag(
  svg: string,
): { end: number; start: number; tag: string } | null {
  const start = svg.search(/<svg\b/i)
  if (start < 0) return null
  const end = svg.indexOf('>', start)
  if (end < 0) return null
  return { end, start, tag: svg.slice(start, end) }
}

function readSvgSize(svg: string): { height: number; width: number } | null {
  const open = readSvgOpenTag(svg)
  if (!open) return null
  const viewBox = open.tag.match(
    /viewbox=["']\s*(?:[\d.-]+\s+){2}([\d.-]+)\s+([\d.-]+)/i,
  )
  if (viewBox) {
    const width = Number.parseFloat(viewBox[1])
    const height = Number.parseFloat(viewBox[2])
    if (width > 0 && height > 0) return { height, width }
  }
  const widthAttr = open.tag.match(/\bwidth=["']([\d.]+)(?:px)?["']/i)
  const heightAttr = open.tag.match(/\bheight=["']([\d.]+)(?:px)?["']/i)
  if (!widthAttr || !heightAttr) return null
  const width = Number.parseFloat(widthAttr[1])
  const height = Number.parseFloat(heightAttr[1])
  if (!(width > 0) || !(height > 0)) return null
  return { height, width }
}

function applySvgPixelSize(svg: string, width: number, height: number): string {
  const open = readSvgOpenTag(svg)
  if (!open) return svg
  let tag = open.tag
  if (/\bwidth=["'][^"']*["']/i.test(tag)) {
    tag = tag.replace(/\bwidth=["'][^"']*["']/i, `width="${width}"`)
  } else {
    tag = tag.replace(/<svg\b/i, `<svg width="${width}"`)
  }
  if (/\bheight=["'][^"']*["']/i.test(tag)) {
    tag = tag.replace(/\bheight=["'][^"']*["']/i, `height="${height}"`)
  } else {
    tag = tag.replace(/<svg\b/i, `<svg height="${height}"`)
  }
  return svg.slice(0, open.start) + tag + svg.slice(open.end)
}

function canvasPngFromImage(
  image: CanvasImageSource,
  width: number,
  height: number,
): string | null {
  const size = fitPixelSize(width, height)
  if (!size) return null
  const canvas = document.createElement('canvas')
  canvas.width = size.width
  canvas.height = size.height
  const context = canvas.getContext('2d')
  if (!context) return null
  try {
    context.drawImage(image, 0, 0, size.width, size.height)
    return canvas.toDataURL('image/png')
  } catch {
    return null
  }
}

export function svgMarkupFromDataUrl(src: string): string | null {
  const match = /^data:image\/svg\+xml([^,]*),(.*)$/i.exec(src)
  if (!match) return null
  const [, meta, payload] = match
  try {
    if (/;base64/i.test(meta)) {
      const binary = atob(payload)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++)
        bytes[i] = binary.codePointAt(i) ?? 0
      return new TextDecoder().decode(bytes)
    }
    return decodeURIComponent(payload)
  } catch {
    return null
  }
}

export function rasterizeLoadedImageToPng(
  image: HTMLImageElement,
): string | null {
  const width = image.naturalWidth || image.width
  const height = image.naturalHeight || image.height
  return canvasPngFromImage(image, width, height)
}

export function rasterizeSvgMarkupToPng(svg: string): Promise<string> {
  const size = readSvgSize(svg)
  const target = size ? previewPixelSize(size.width, size.height) : null
  const markup = target
    ? applySvgPixelSize(svg, target.width, target.height)
    : svg

  return new Promise((resolve, reject) => {
    const blob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const image = new Image()
    const cleanup = () => URL.revokeObjectURL(url)
    image.onload = () => {
      const width = target?.width ?? (image.naturalWidth || image.width)
      const height = target?.height ?? (image.naturalHeight || image.height)
      const png = canvasPngFromImage(image, width, height)
      cleanup()
      if (!png) {
        reject(new Error('Failed to rasterize SVG'))
        return
      }
      resolve(png)
    }
    image.onerror = () => {
      cleanup()
      reject(new Error('Failed to load SVG for rasterize'))
    }
    if (target) {
      image.width = target.width
      image.height = target.height
    }
    image.src = url
  })
}
