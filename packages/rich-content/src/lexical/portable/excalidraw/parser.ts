import type { ExcalidrawScene } from './types'

export type ParsedSnapshot =
  | { kind: 'empty' }
  | { kind: 'inline'; scene: ExcalidrawScene }
  | { kind: 'remote'; fetchUrl: string }
  | { kind: 'incremental'; fetchUrl: string; delta: object }
  | { kind: 'error'; error: string }

function tryParseJson<T = unknown>(input: string): T | null {
  try {
    return JSON.parse(input) as T
  } catch {
    return null
  }
}

function resolveUrl(
  url: string,
  apiUrl: string | undefined,
): { fetchUrl: string } | { error: string } {
  if (url.startsWith('http') || url.startsWith('blob:')) {
    return { fetchUrl: url }
  }
  if (url.startsWith('ref:')) {
    if (!apiUrl) return { error: 'Missing apiUrl for ref resolution' }
    return { fetchUrl: `${apiUrl}/objects/${url.slice(4)}` }
  }
  return { error: 'Unrecognized snapshot format' }
}

export function parseSnapshot(
  raw: string | object | null | undefined,
  apiUrl: string | undefined,
): ParsedSnapshot {
  if (raw === null || raw === undefined || raw === '') return { kind: 'empty' }
  if (typeof raw === 'object') {
    const scene = normalizeScene(raw)
    return scene
      ? { kind: 'inline', scene }
      : { kind: 'error', error: 'Invalid snapshot' }
  }
  const inline = tryParseJson<ExcalidrawScene>(raw)
  if (inline && typeof inline === 'object' && Array.isArray(inline.elements)) {
    return { kind: 'inline', scene: normalizeScene(inline) ?? inline }
  }

  const [firstLine, ...rest] = raw.split('\n')
  const otherLines = rest.join('\n').trim()
  const resolved = resolveUrl(firstLine.trim(), apiUrl)
  if ('error' in resolved) return { kind: 'error', error: resolved.error }

  if (!otherLines) {
    return { kind: 'remote', fetchUrl: resolved.fetchUrl }
  }
  const delta = tryParseJson<object>(otherLines)
  if (!delta) {
    return { kind: 'error', error: 'Invalid delta payload' }
  }
  return { kind: 'incremental', fetchUrl: resolved.fetchUrl, delta }
}

export function normalizeScene(input: unknown): ExcalidrawScene | null {
  if (typeof input === 'string') {
    return normalizeScene(tryParseJson(input))
  }
  if (!input || typeof input !== 'object') return null
  const wrapped = input as { data?: unknown }
  if (
    !Array.isArray((input as Partial<ExcalidrawScene>).elements) &&
    wrapped.data !== undefined
  ) {
    return normalizeScene(wrapped.data)
  }
  const candidate = input as Partial<ExcalidrawScene>
  if (!Array.isArray(candidate.elements)) return null
  return {
    type: 'excalidraw',
    elements: candidate.elements,
    appState: candidate.appState ?? {},
    files: candidate.files ?? {},
  }
}
