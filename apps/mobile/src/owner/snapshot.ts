import { isRecord } from '@/lib/is-record'

export interface OwnerSnapshot {
  avatarUrl: string | null
  name: string
  siteHost: string
  socialIds?: Record<string, string> | null
  webUrl: string
}

export function hostFromUrl(value: string): string {
  const input = value.trim()
  if (!input) return ''
  try {
    const host = new URL(input.includes('://') ? input : `https://${input}`)
      .hostname
    if (!host.includes('.')) return ''
    return host.replace(/^www\./, '')
  } catch {
    return ''
  }
}

export function displaySite(host: string): string {
  return host.toUpperCase()
}

export function parseSnapshot(value: unknown): OwnerSnapshot | null {
  if (!isRecord(value)) return null
  const name = asText(value.name)
  const siteHost = asText(value.siteHost)
  const webUrl = asText(value.webUrl)
  if (!name || !siteHost || !webUrl) return null
  return {
    name,
    siteHost,
    webUrl,
    avatarUrl: httpUrl(asText(value.avatarUrl)),
    socialIds: asSocialIds(value.socialIds),
  }
}

export function snapshotFromAggregate(value: unknown): OwnerSnapshot | null {
  if (!isRecord(value)) return null
  const user = isRecord(value.user) ? value.user : null
  const seo = isRecord(value.seo) ? value.seo : null
  const url = isRecord(value.url) ? value.url : null
  const name = asText(user?.name) || asText(seo?.title)
  const webUrl = asText(url?.webUrl)
  const siteHost = hostFromUrl(webUrl) || hostFromUrl(asText(user?.url))
  if (!name || !siteHost) return null
  return {
    name,
    siteHost,
    webUrl: webUrl || `https://${siteHost}`,
    avatarUrl: httpUrl(asText(user?.avatar) || asText(user?.image)),
    socialIds: asSocialIds(user?.socialIds),
  }
}

function asSocialIds(value: unknown): Record<string, string> | null {
  if (!isRecord(value)) return null
  const entries = Object.entries(value).flatMap(([key, raw]) => {
    const id = asText(raw)
    return id ? [[key, id] as const] : []
  })
  return entries.length > 0 ? Object.fromEntries(entries) : null
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function httpUrl(value: string): string | null {
  if (!/^https?:\/\//i.test(value)) return null
  try {
    return new URL(value).toString()
  } catch {
    return null
  }
}
