import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  PREVIEW_MAX_PIXEL,
  rasterizeLoadedImageToPng,
  rasterizeSvgMarkupToPng,
  svgMarkupFromDataUrl,
} from './rasterize-to-png'

const PNG = 'data:image/png;base64,QQ=='

function installCanvasMock(png = PNG) {
  const canvases: Array<{ width: number; height: number }> = []
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    drawImage: vi.fn(),
  })) as never
  HTMLCanvasElement.prototype.toDataURL = vi.fn(function toDataURL(
    this: HTMLCanvasElement,
  ) {
    canvases.push({ width: this.width, height: this.height })
    return png
  })
  return canvases
}

function installImageMock(naturalWidth: number, naturalHeight: number) {
  class FakeImage {
    height = 0
    naturalHeight = naturalHeight
    naturalWidth = naturalWidth
    onerror: (() => void) | null = null
    onload: (() => void) | null = null
    width = 0
    set src(_value: string) {
      queueMicrotask(() => this.onload?.())
    }
  }
  vi.stubGlobal('Image', FakeImage)
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('rasterizeSvgMarkupToPng', () => {
  it('returns a png data URL', async () => {
    installCanvasMock()
    installImageMock(200, 100)

    const result = await rasterizeSvgMarkupToPng(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"/>',
    )

    expect(result).toBe(PNG)
  })

  it('fits the long edge to PREVIEW_MAX_PIXEL', async () => {
    const canvases = installCanvasMock()
    installImageMock(8000, 4000)

    await rasterizeSvgMarkupToPng(
      '<svg xmlns="http://www.w3.org/2000/svg" width="8000" height="4000"/>',
    )

    expect(canvases[0]).toEqual({
      width: PREVIEW_MAX_PIXEL,
      height: PREVIEW_MAX_PIXEL / 2,
    })
  })

  it('upscales a small svg by devicePixelRatio, not to PREVIEW_MAX_PIXEL', async () => {
    Object.defineProperty(window, 'devicePixelRatio', {
      configurable: true,
      value: 3,
    })
    const canvases = installCanvasMock()
    installImageMock(200, 100)

    await rasterizeSvgMarkupToPng(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" width="200" height="100"/>',
    )

    expect(canvases[0]).toEqual({ width: 600, height: 300 })
  })

  it('uses viewBox size when width is 100%', async () => {
    Object.defineProperty(window, 'devicePixelRatio', {
      configurable: true,
      value: 3,
    })
    const canvases = installCanvasMock()
    installImageMock(300, 150)

    await rasterizeSvgMarkupToPng(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2000 400" width="100%" height="100%"/>',
    )

    expect(canvases[0]).toEqual({
      width: PREVIEW_MAX_PIXEL,
      height: Math.round(PREVIEW_MAX_PIXEL / 5),
    })
  })
})

describe('svgMarkupFromDataUrl', () => {
  it('decodes utf-8 base64 svg data urls', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg">中文</svg>'
    const bytes = new TextEncoder().encode(svg)
    let binary = ''
    for (const byte of bytes) binary += String.fromCodePoint(byte)
    const src = `data:image/svg+xml;base64,${btoa(binary)}`

    expect(svgMarkupFromDataUrl(src)).toBe(svg)
  })
})

describe('rasterizeLoadedImageToPng', () => {
  it('returns null when the image has no intrinsic size', () => {
    installCanvasMock()
    const image = document.createElement('img')
    expect(rasterizeLoadedImageToPng(image)).toBeNull()
  })

  it('draws a loaded image onto a png data URL', () => {
    installCanvasMock()
    const image = document.createElement('img')
    Object.defineProperty(image, 'naturalWidth', { value: 40 })
    Object.defineProperty(image, 'naturalHeight', { value: 20 })

    expect(rasterizeLoadedImageToPng(image)).toBe(PNG)
  })
})
