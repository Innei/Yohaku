const SVG_NS = 'http://www.w3.org/2000/svg'

const ROOT = /<svg\b[^>]*>/i

export function isSvgSource(src: unknown): src is string {
  return (
    typeof src === 'string' &&
    /^\s*(?:<\?xml[^>]*>\s*)?(?:<!--[\s\S]*?-->\s*)*<svg[\s/>]/i.test(src)
  )
}

function normalizeSvgSource(src: string): string {
  const root = ROOT.exec(src)
  if (!root || /\sxmlns\s*=/.test(root[0])) return src
  const at = root.index + 4
  return `${src.slice(0, at)} xmlns="${SVG_NS}"${src.slice(at)}`
}

export function svgDataUrl(src: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(normalizeSvgSource(src))}`
}
