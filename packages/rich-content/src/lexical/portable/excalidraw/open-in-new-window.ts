import type { SceneBounds } from './Scene'
import type { StaticTheme } from './types'

const REVOKE_DELAY_MS = 60_000

function buildFontStyle(origin: string): string {
  return `
@import url('${origin}/fonts/excalidraw/lxgw/lxgw-wenkai-screen.css');
@font-face {
  font-family: 'Excalifont';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('${origin}/fonts/excalidraw/Excalifont-Latin.woff2') format('woff2');
}
@font-face {
  font-family: 'Excalifont';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('${origin}/fonts/excalidraw/Excalifont-LatinExt.woff2') format('woff2');
}
@font-face {
  font-family: 'Virgil';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('${origin}/fonts/excalidraw/Virgil-Regular.woff2') format('woff2');
}
@font-face {
  font-family: 'Cascadia Code';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('${origin}/fonts/excalidraw/CascadiaCode-Regular.woff2') format('woff2');
}
`.trim()
}

function buildStandaloneSvg(
  innerGroupMarkup: string,
  bounds: SceneBounds,
  theme: StaticTheme,
  options: { includeFonts: boolean; origin: string; pixelSize: boolean },
): string {
  const isDark = theme === 'dark'
  const fontStyle = options.includeFonts ? buildFontStyle(options.origin) : ''
  const bg = isDark ? '#1c1c1d' : '#ffffff'
  const wrapperFilter = isDark
    ? ' style="filter:invert(93%) hue-rotate(180deg);"'
    : ''
  const width = Math.max(1, Math.round(bounds.width))
  const height = Math.max(1, Math.round(bounds.height))
  const sizeAttrs = options.pixelSize
    ? ` width="${width}" height="${height}"`
    : ' width="100%" height="100%"'

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}" preserveAspectRatio="xMidYMid meet"${sizeAttrs}>
  <defs>
    <style type="text/css"><![CDATA[
${fontStyle}
svg { background: ${bg}; }
]]></style>
  </defs>
  <g${wrapperFilter}>${innerGroupMarkup}</g>
</svg>`
}

export function serializeStandaloneSceneSvg({
  bounds,
  includeFonts = true,
  origin = typeof window === 'undefined' ? '' : window.location.origin,
  pixelSize = false,
  svgElement,
  theme,
}: {
  bounds: SceneBounds
  includeFonts?: boolean
  origin?: string
  pixelSize?: boolean
  svgElement: SVGSVGElement | null
  theme: StaticTheme
}): string | null {
  if (!svgElement) return null
  const sourceGroup = svgElement.querySelector(':scope > g')
  if (!sourceGroup) return null

  const cloned = sourceGroup.cloneNode(true) as SVGGElement
  cloned.removeAttribute('transform')
  const innerMarkup = new XMLSerializer().serializeToString(cloned)
  return buildStandaloneSvg(innerMarkup, bounds, theme, {
    includeFonts,
    origin,
    pixelSize,
  })
}

export interface OpenSceneInNewWindowParams {
  bounds: SceneBounds
  svgElement: SVGSVGElement | null
  theme: StaticTheme
}

export function openSceneInNewWindow({
  bounds,
  svgElement,
  theme,
}: OpenSceneInNewWindowParams): void {
  const svg = serializeStandaloneSceneSvg({ bounds, svgElement, theme })
  if (!svg) return
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const opened = window.open(url, '_blank', 'noopener,noreferrer')
  if (!opened) {
    URL.revokeObjectURL(url)
    return
  }
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS)
}
