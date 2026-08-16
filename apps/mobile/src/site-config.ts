import type { OwnerSnapshot } from '@/owner/snapshot'

export interface SiteOverlay {
  apiUrl?: string
  bundledOwner?: OwnerSnapshot | null
  bundleId?: string
  privacyUrl?: string
  scheme?: string
  siteHosts?: readonly string[]
  siteUrl?: string
}

export interface SiteConfig {
  apiUrl: string
  bundledOwner: OwnerSnapshot | null
  bundleId: string
  privacyUrl: string
  scheme: string
  siteHosts: readonly string[]
  siteUrl: string
}

export const publicSite: SiteConfig = {
  apiUrl: '',
  siteUrl: '',
  siteHosts: [],
  privacyUrl: '',
  scheme: 'yohaku',
  bundleId: 'dev.yohaku.app',
  bundledOwner: null,
}

export function privacyUrlFrom(siteUrl: string, explicit?: string): string {
  if (explicit !== undefined) return explicit
  const trimmed = siteUrl.trim().replace(/\/$/, '')
  return trimmed ? `${trimmed}/privacy` : ''
}

export function mergeSite(overlay: SiteOverlay | null | undefined): SiteConfig {
  const siteUrl = overlay?.siteUrl ?? publicSite.siteUrl
  return {
    apiUrl: overlay?.apiUrl ?? publicSite.apiUrl,
    siteUrl,
    siteHosts: overlay?.siteHosts
      ? [...overlay.siteHosts]
      : [...publicSite.siteHosts],
    privacyUrl: privacyUrlFrom(siteUrl, overlay?.privacyUrl),
    scheme: overlay?.scheme ?? publicSite.scheme,
    bundleId: overlay?.bundleId ?? publicSite.bundleId,
    bundledOwner:
      overlay?.bundledOwner === undefined
        ? publicSite.bundledOwner
        : overlay.bundledOwner,
  }
}

export function hostsForSiteUrl(
  siteUrl: string,
  configured: readonly string[] = [],
): string[] {
  const hosts = new Set(configured)
  const host = hostFromSiteUrl(siteUrl)
  if (host) {
    hosts.add(host)
    hosts.add(`www.${host}`)
  }
  return [...hosts]
}

function hostFromSiteUrl(value: string): string {
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
