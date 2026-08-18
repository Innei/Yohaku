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
): string {
  const isDark = theme === 'dark'
  const origin = window.location.origin
  const fontStyle = buildFontStyle(origin)
  const bg = isDark ? '#1c1c1d' : '#ffffff'
  const wrapperFilter = isDark
    ? ' style="filter:invert(93%) hue-rotate(180deg);"'
    : ''

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}" preserveAspectRatio="xMidYMid meet" width="100%" height="100%">
  <defs>
    <style type="text/css"><![CDATA[
${fontStyle}
svg { background: ${bg}; }
]]></style>
  </defs>
  <g${wrapperFilter}>${innerGroupMarkup}</g>
</svg>`
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
  if (!svgElement) return
  const sourceGroup = svgElement.querySelector(':scope > g')
  if (!sourceGroup) return

  const cloned = sourceGroup.cloneNode(true) as SVGGElement
  cloned.removeAttribute('transform')
  const innerMarkup = new XMLSerializer().serializeToString(cloned)

  const svg = buildStandaloneSvg(innerMarkup, bounds, theme)
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const opened = window.open(url, '_blank', 'noopener,noreferrer')
  if (!opened) {
    URL.revokeObjectURL(url)
    return
  }
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS)
}
