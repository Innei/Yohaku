import { hostsForSiteUrl, privacyUrlFrom, site } from '@/site'

let liveUrl = site.siteUrl
let liveHosts = hostsForSiteUrl(site.siteUrl, site.siteHosts)

export function hydrateSiteFromOwner(webUrl: string, siteHost?: string | null) {
  liveUrl = webUrl || site.siteUrl
  liveHosts = hostsForSiteUrl(liveUrl, [
    ...site.siteHosts,
    ...(siteHost ? [siteHost, `www.${siteHost}`] : []),
  ])
}

export function resetSiteRuntime() {
  liveUrl = site.siteUrl
  liveHosts = hostsForSiteUrl(site.siteUrl, site.siteHosts)
}

export function getSiteUrl(): string {
  return liveUrl
}

export function getSiteHosts(): readonly string[] {
  return liveHosts
}

export function getPrivacyUrl(): string {
  return site.privacyUrl || privacyUrlFrom(liveUrl)
}

export function siteHref(path: string): string {
  const base = getSiteUrl().replace(/\/$/, '')
  const suffix = path.startsWith('/') ? path : `/${path}`
  return base ? `${base}${suffix}` : suffix
}
