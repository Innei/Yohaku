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

export function rasterizeLoadedImageToPng(
  image: HTMLImageElement,
): string | null {
  const width = image.naturalWidth || image.width
  const height = image.naturalHeight || image.height
  return canvasPngFromImage(image, width, height)
}

export function rasterizeSvgMarkupToPng(svg: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const image = new Image()
    const cleanup = () => URL.revokeObjectURL(url)
    image.onload = () => {
      const png = rasterizeLoadedImageToPng(image)
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
    image.src = url
  })
}
