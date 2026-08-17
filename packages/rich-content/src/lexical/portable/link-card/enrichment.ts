import type { HostEnrichment, HostEnrichmentAttribute } from '../../../host'

export function findAttr(
  data: HostEnrichment,
  key: string,
): HostEnrichmentAttribute | undefined {
  return data.attributes?.find((a) => a.key === key)
}

export function strAttr(data: HostEnrichment, key: string): string | null {
  const a = findAttr(data, key)
  if (!a) return null
  const v = a.value
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  return s.length ? s : null
}

export function fmtCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
  return String(n)
}

export function fmtTimeAgo(s?: string): string | null {
  if (!s) return null
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return null
  const diff = Date.now() - d.getTime()
  const day = 24 * 3600_000
  if (diff < day) return 'today'
  if (diff < 7 * day) return `${Math.round(diff / day)} days ago`
  if (diff < 60 * day) return `${Math.round(diff / (7 * day))} weeks ago`
  return d.toISOString().slice(0, 10)
}

export function fmtYear(s: string | undefined): string | null {
  if (!s) return null
  const m = /^(\d{4})/.exec(s)
  return m ? m[1] : null
}

export function hostOf(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}
