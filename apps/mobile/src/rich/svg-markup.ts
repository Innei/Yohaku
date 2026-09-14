import { Fragment, isValidElement, type ReactNode } from 'react'

const MEMO = Symbol.for('react.memo')
const KEEP_CAMEL = new Set(['viewBox', 'preserveAspectRatio'])

function escapeText(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function kebab(name: string): string {
  return name.replaceAll(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)
}

function styleString(style: Record<string, unknown>): string {
  return Object.entries(style)
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    )
    .map(([key, value]) => `${kebab(key)}:${String(value)}`)
    .join(';')
}

function attributes(props: Record<string, unknown>): string {
  let out = ''
  for (const [key, value] of Object.entries(props)) {
    if (key === 'children' || key === 'key' || key === 'ref') continue
    if (key === 'dangerouslySetInnerHTML') continue
    if (value === undefined || value === null || value === false) continue
    const name =
      key === 'className' ? 'class' : KEEP_CAMEL.has(key) ? key : kebab(key)
    const text =
      key === 'style' && typeof value === 'object'
        ? styleString(value as Record<string, unknown>)
        : value === true
          ? ''
          : String(value)
    out += ` ${name}="${escapeText(text)}"`
  }
  return out
}

// Serialises a hook-free React SVG tree to markup. react-dom/server needs
// MessageChannel, which Hermes lacks, and the scene renderer only uses host
// elements, fragments, memo wrappers and plain function components.
export function reactToSvg(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean')
    return ''
  if (typeof node === 'string' || typeof node === 'number')
    return escapeText(String(node))
  if (Array.isArray(node)) return node.map(reactToSvg).join('')
  if (!isValidElement(node)) return ''
  const props = node.props as Record<string, unknown>
  const type = node.type as unknown
  if (type === Fragment) return reactToSvg(props.children as ReactNode)
  if (typeof type === 'string') {
    const inner = props.dangerouslySetInnerHTML
      ? String((props.dangerouslySetInnerHTML as { __html: string }).__html)
      : reactToSvg(props.children as ReactNode)
    return `<${type}${attributes(props)}>${inner}</${type}>`
  }
  if (typeof type === 'object' && type !== null) {
    const wrapper = type as { $$typeof?: symbol; type?: unknown }
    if (wrapper.$$typeof === MEMO) {
      return reactToSvg({ ...node, type: wrapper.type } as ReactNode)
    }
    return ''
  }
  if (typeof type === 'function') {
    return reactToSvg((type as (p: unknown) => ReactNode)(props))
  }
  return ''
}
